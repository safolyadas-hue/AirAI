/**
 * In-Memory Sliding-Window Rate Limiter
 *
 * NOTE ON SERVERLESS EXECUTION:
 * In a serverless/stateless runtime (like Netlify Functions or AWS Lambda), in-memory state
 * is isolated to individual container instances and resets when containers are recycled.
 * Consequently, this in-memory implementation provides best-effort burst protection against
 * single-client flooding.
 *
 * PRODUCTION ALTERNATIVE:
 * In high-scale production, use a centralized, low-latency distributed store such as
 * Upstash Redis, Cloudflare Workers KV, AWS ElastiCache, or an edge API Gateway rate limiter
 * using the generic cell rate algorithm (GCRA) or token bucket.
 */
import { errorResponse } from './http.js';

export const RATE_LIMIT_CONFIG = Object.freeze({
  data: { maxRequests: 60, windowMs: 60 * 1000 }, // 60 requests / minute for data endpoints
  ai: { maxRequests: 20, windowMs: 60 * 1000 } // 20 requests / minute for generative AI endpoints
});

/** @type {Map<string, number[]>} */
const requestLog = new Map();

/**
 * Checks rate limits for a given client key and window.
 * @param {string} clientKey - Client IP address or token.
 * @param {number} [maxRequests=60]
 * @param {number} [windowMs=60000]
 * @returns {{ allowed: boolean, remaining: number, retryAfterSeconds: number }}
 */
export function checkRateLimit(clientKey, maxRequests = 60, windowMs = 60000) {
  const now = Date.now();
  const timestamps = requestLog.get(clientKey) || [];

  // Filter out timestamps older than the sliding window
  const active = timestamps.filter((time) => now - time < windowMs);

  if (active.length >= maxRequests) {
    requestLog.set(clientKey, active);
    const oldestTimestamp = active[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldestTimestamp + windowMs - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds
    };
  }

  active.push(now);
  requestLog.set(clientKey, active);

  return {
    allowed: true,
    remaining: maxRequests - active.length,
    retryAfterSeconds: 0
  };
}

/**
 * Applies rate limiting to a request and generates a 429 response if breached.
 * @param {Request} req
 * @param {'data' | 'ai'} [type='data']
 * @returns {Response | null} 429 Response if rate limit is exceeded, or null if allowed.
 */
export function enforceRateLimit(req, type = 'data') {
  const forwarded = req.headers.get('x-forwarded-for');
  const clientIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
  const config = RATE_LIMIT_CONFIG[type] || RATE_LIMIT_CONFIG.data;

  const key = `${type}:${clientIp}`;
  const check = checkRateLimit(key, config.maxRequests, config.windowMs);

  if (!check.allowed) {
    return errorResponse('Too many requests. Please slow down and try again later.', 429, {
      'Retry-After': String(check.retryAfterSeconds)
    });
  }

  return null;
}
