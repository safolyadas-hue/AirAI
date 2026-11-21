/**
 * HTTP Response and CORS Utilities for Netlify Functions v2
 */

export const CORS_HEADERS = Object.freeze({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
});

/**
 * Creates a standard JSON Response.
 * @param {unknown} data - Serializable body data.
 * @param {number} [status=200] - HTTP status code.
 * @param {HeadersInit} [extraHeaders={}] - Additional headers.
 * @returns {Response}
 */
export function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      ...extraHeaders
    }
  });
}

/**
 * Creates a standardized JSON error response.
 * @param {string} message - Error description.
 * @param {number} [status=400] - HTTP status code.
 * @returns {Response}
 */
export function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status);
}
