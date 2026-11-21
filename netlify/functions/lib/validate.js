/**
 * Strict Input Validation and Sanitization Utilities
 */
import { validateProfile } from '../../../public/js/domain/profile.js';
export { parseJsonBody, safeParseJson } from './http.js';

/**
 * Validates a geographic latitude value.
 * @param {unknown} val
 * @returns {boolean}
 */
export function isValidLat(val) {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return typeof num === 'number' && !Number.isNaN(num) && num >= -90 && num <= 90;
}

/**
 * Validates a geographic longitude value.
 * @param {unknown} val
 * @returns {boolean}
 */
export function isValidLon(val) {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return typeof num === 'number' && !Number.isNaN(num) && num >= -180 && num <= 180;
}

/**
 * Validates and sanitizes city search strings.
 * Enforces maximum 80 characters and strips invisible control characters.
 * @param {unknown} q
 * @returns {{ valid: boolean, sanitized: string, error?: string }}
 */
export function validateCityQuery(q) {
  if (typeof q !== 'string') {
    return { valid: false, sanitized: '', error: 'Search query must be a string' };
  }

  // Strip ASCII and Unicode control characters
  // eslint-disable-next-line no-control-regex
  const stripped = q.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim();

  if (stripped.length < 2) {
    return { valid: false, sanitized: '', error: 'Query must be at least 2 characters long' };
  }

  if (stripped.length > 80) {
    return { valid: false, sanitized: '', error: 'Query exceeds maximum 80 characters' };
  }

  return { valid: true, sanitized: stripped };
}

/**
 * Legacy compatibility helper for location strings.
 * @param {unknown} location
 * @returns {boolean}
 */
export function isValidLocation(location) {
  return typeof location === 'string' && location.trim().length >= 2 && location.length <= 100;
}

/**
 * Validates household profile payloads by delegating to the single source of truth.
 * @param {unknown} raw - Raw incoming profile payload.
 * @returns {ReturnType<typeof validateProfile>}
 */
export function validateProfilePayload(raw) {
  return validateProfile(raw);
}

/**
 * Validates interactive chat payload.
 * Enforces message character limits (500) and history item counts (10).
 * @param {unknown} payload
 * @returns {{
 *   valid: boolean,
 *   error?: string,
 *   sanitized?: {
 *     message: string,
 *     history: Array<{ role: 'user' | 'assistant', text: string }>,
 *     context?: any
 *   }
 * }}
 */
export function validateChatPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Chat payload must be an object' };
  }

  const p = /** @type {Record<string, any>} */ (payload);

  if (typeof p.message !== 'string' || !p.message.trim()) {
    return { valid: false, error: 'Chat message string is required' };
  }

  // eslint-disable-next-line no-control-regex
  const cleanMessage = p.message.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim();

  if (cleanMessage.length > 500) {
    return { valid: false, error: 'Message exceeds maximum length of 500 characters' };
  }

  let sanitizedHistory = [];
  if (Array.isArray(p.history)) {
    if (p.history.length > 10) {
      return { valid: false, error: 'History exceeds maximum limit of 10 messages' };
    }

    for (const item of p.history) {
      if (!item || typeof item !== 'object') {
        return { valid: false, error: 'Invalid history item format' };
      }
      if (item.role !== 'user' && item.role !== 'assistant') {
        return { valid: false, error: 'History item role must be "user" or "assistant"' };
      }
      if (typeof item.text !== 'string' || item.text.length > 500) {
        return {
          valid: false,
          error: 'History message text must be a string up to 500 characters'
        };
      }
      sanitizedHistory.push({
        role: item.role,
        // eslint-disable-next-line no-control-regex
        text: item.text.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim()
      });
    }
  }

  return {
    valid: true,
    sanitized: {
      message: cleanMessage,
      history: sanitizedHistory,
      context: p.context && typeof p.context === 'object' ? p.context : {}
    }
  };
}
