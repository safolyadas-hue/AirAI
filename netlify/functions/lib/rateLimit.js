/**
 * In-Memory Sliding Window Rate Limiter
 * Protects endpoints against rapid automated abuse.
 */

const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 30; // Limit to 30 requests per minute per IP

/** @type {Map<string, number[]>} */
const requestLog = new Map();

/**
 * Checks whether an incoming client key is within rate limits.
 * @param {string} clientKey - Client identifier (e.g. IP address).
 * @param {number} [maxRequests=MAX_REQUESTS_PER_WINDOW]
 * @param {number} [windowMs=WINDOW_MS]
 * @returns {{ allowed: boolean, remaining: number }}
 */
export function checkRateLimit(
  clientKey,
  maxRequests = MAX_REQUESTS_PER_WINDOW,
  windowMs = WINDOW_MS
) {
  const now = Date.now();
  const timestamps = requestLog.get(clientKey) || [];

  // Remove timestamps outside the sliding window
  const activeTimestamps = timestamps.filter((time) => now - time < windowMs);

  if (activeTimestamps.length >= maxRequests) {
    requestLog.set(clientKey, activeTimestamps);
    return { allowed: false, remaining: 0 };
  }

  activeTimestamps.push(now);
  requestLog.set(clientKey, activeTimestamps);

  return {
    allowed: true,
    remaining: maxRequests - activeTimestamps.length
  };
}
