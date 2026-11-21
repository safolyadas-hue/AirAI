/**
 * Input Validation Utilities for API Endpoints
 */

/**
 * Validates whether an incoming payload is valid JSON and parses it.
 * @param {Request} req
 * @returns {Promise<{ valid: boolean, data?: any, error?: string }>}
 */
export async function parseJsonBody(req) {
  try {
    const text = await req.text();
    if (!text || !text.trim()) {
      return { valid: false, error: 'Empty request body' };
    }
    const data = JSON.parse(text);
    return { valid: true, data };
  } catch {
    return { valid: false, error: 'Malformed JSON payload' };
  }
}

/**
 * Validates location query parameter.
 * @param {string | null} location
 * @returns {boolean}
 */
export function isValidLocation(location) {
  return typeof location === 'string' && location.trim().length >= 2 && location.length <= 100;
}
