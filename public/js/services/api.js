/**
 * API Service for CleanAir Companion
 * Handles network requests to Netlify Functions with timeouts, typed errors,
 * 10-minute air cache, and in-flight request de-duplication.
 */
import { API_ENDPOINTS, API_TIMEOUTS_MS, CACHE_CONFIG } from '../config.js';

/**
 * Typed API Error for deterministic error handling across the controller.
 */
export class ApiError extends Error {
  /**
   * @param {'network' | 'timeout' | 'http' | 'invalid'} kind
   * @param {string} message
   * @param {number | null} [status=null]
   * @param {number | null} [retryAfter=null]
   */
  constructor(kind, message, status = null, retryAfter = null) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

/** @type {Map<string, Promise<any>>} */
const inFlightRequests = new Map();

/** @type {Map<string, { data: any, expiresAt: number }>} */
const airCache = new Map();

/**
 * Clears the in-memory air quality cache (for tests or manual hard reset).
 */
export function clearAirCache() {
  airCache.clear();
  inFlightRequests.clear();
}

/**
 * Executes a fetch request with AbortController timeout and in-flight de-duplication.
 * @param {string} dedupeKey
 * @param {string} url
 * @param {RequestInit} options
 * @param {number} timeoutMs
 * @returns {Promise<any>}
 */
async function requestJson(dedupeKey, url, options, timeoutMs) {
  if (inFlightRequests.has(dedupeKey)) {
    return inFlightRequests.get(dedupeKey);
  }

  const run = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      if (!response.ok) {
        const rawRetry = response.headers?.get?.('Retry-After');
        const parsedRetry = rawRetry ? parseInt(rawRetry, 10) : NaN;
        const retryAfter = Number.isFinite(parsedRetry) && parsedRetry > 0 ? parsedRetry : null;
        throw new ApiError('http', `HTTP ${response.status}`, response.status, retryAfter);
      }
      try {
        return await response.json();
      } catch {
        throw new ApiError('invalid', 'Invalid JSON response', response.status);
      }
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (err && err.name === 'AbortError') {
        throw new ApiError('timeout', 'Request timed out');
      }
      throw new ApiError('network', 'Network request failed');
    } finally {
      clearTimeout(timer);
      inFlightRequests.delete(dedupeKey);
    }
  })();

  inFlightRequests.set(dedupeKey, run);
  return run;
}

/**
 * Searches for candidate cities via /api/air-quality?q=...
 * @param {string} q
 * @returns {Promise<import('../../../netlify/functions/lib/types.js').GeocodingLocationResult[]>}
 */
export async function searchCity(q) {
  const query = typeof q === 'string' ? q.trim() : '';
  const params = new URLSearchParams({ q: query });
  const url = `${API_ENDPOINTS.AIR_QUALITY}?${params.toString()}`;
  const data = await requestJson(`GET:${url}`, url, { method: 'GET' }, API_TIMEOUTS_MS.SEARCH);
  if (!data || !Array.isArray(data.results)) {
    throw new ApiError('invalid', 'Invalid geocoding response shape');
  }
  return data.results;
}

/**
 * Fetches current and hourly air quality data for coordinates with 10-min cache.
 * @param {number} lat
 * @param {number} lon
 * @param {{ bypassCache?: boolean }} [options={}]
 * @returns {Promise<import('../../../netlify/functions/lib/types.js').NormalizedAirQualityResponse>}
 */
export async function getAirQuality(lat, lon, { bypassCache = false } = {}) {
  const roundedLat = Number(lat).toFixed(2);
  const roundedLon = Number(lon).toFixed(2);
  const cacheKey = `${roundedLat},${roundedLon}`;

  if (!bypassCache) {
    const cached = airCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }
  }

  const params = new URLSearchParams({ lat: String(lat), lon: String(lon) });
  const url = `${API_ENDPOINTS.AIR_QUALITY}?${params.toString()}`;
  const data = await requestJson(`GET:${url}`, url, { method: 'GET' }, API_TIMEOUTS_MS.AIR);

  if (
    !data ||
    typeof data !== 'object' ||
    !data.airSnapshot ||
    typeof data.airSnapshot.aqi !== 'number' ||
    !Array.isArray(data.hourly)
  ) {
    throw new ApiError('invalid', 'Invalid air quality response shape');
  }

  airCache.set(cacheKey, {
    data,
    expiresAt: Date.now() + CACHE_CONFIG.AIR_TTL_MS
  });
  return data;
}

/**
 * Requests GenAI tailored advice based on profile, airSnapshot, and rulesOutput.
 * @param {{
 *   profile: import('../domain/profile.js').UserProfile,
 *   airSnapshot: import('../../../netlify/functions/lib/types.js').AirSnapshot,
 *   rulesOutput: { riskLevel: string, vulnerableHousehold: boolean, headline: string, actions: Array<any> }
 * }} payload
 * @returns {Promise<import('../../../netlify/functions/lib/types.js').AdviceOutput>}
 */
export async function getAdvice({ profile, airSnapshot, rulesOutput }) {
  const body = JSON.stringify({ profile, airSnapshot, rulesOutput });
  const data = await requestJson(
    `POST:${API_ENDPOINTS.ADVICE}:${body}`,
    API_ENDPOINTS.ADVICE,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    },
    API_TIMEOUTS_MS.ADVICE
  );

  if (!data || typeof data !== 'object' || (typeof data.summary !== 'string' && !data.fallback)) {
    throw new ApiError('invalid', 'Invalid advice response shape');
  }
  return data;
}

/**
 * Sends a chat message to /api/chat.
 * @param {{ message: string, history?: Array<{ role: 'user' | 'assistant', text: string }>, profile?: object | null, airSnapshot?: object | null }} payload
 * @returns {Promise<import('../../../netlify/functions/lib/types.js').ChatOutput>}
 */
export async function sendChat({ message, history = [], profile = null, airSnapshot = null }) {
  const wirePayload = {
    message,
    history,
    context: {
      aqi: airSnapshot?.aqi,
      airSnapshot,
      profile
    }
  };
  const body = JSON.stringify(wirePayload);
  const data = await requestJson(
    `POST:${API_ENDPOINTS.CHAT}:${body}`,
    API_ENDPOINTS.CHAT,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    },
    API_TIMEOUTS_MS.CHAT
  );

  if (!data || typeof data !== 'object' || typeof data.reply !== 'string') {
    throw new ApiError('invalid', 'Invalid chat response shape');
  }
  return data;
}
