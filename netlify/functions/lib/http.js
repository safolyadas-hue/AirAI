/**
 * HTTP Utilities, Security Headers & Safe Body Parsing for Netlify Functions v2
 */

export const MAX_BODY_SIZE_BYTES = 10 * 1024; // 10 KB max payload

export const SECURE_DEFAULT_HEADERS = Object.freeze({
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'no-store, max-age=0',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
});

/**
 * Creates a standard JSON Response with security headers.
 * @param {unknown} data - Serializable body data.
 * @param {number} [status=200] - HTTP status code.
 * @param {Record<string, string>} [headers={}] - Custom headers.
 * @returns {Response}
 */
export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...SECURE_DEFAULT_HEADERS,
      ...headers
    }
  });
}

/**
 * Legacy compatibility alias for json().
 */
export const jsonResponse = json;

/**
 * Creates a standardized JSON error response.
 * @param {string} message - Error description.
 * @param {number} [status=400] - HTTP status code.
 * @param {Record<string, string>} [headers={}] - Custom headers.
 * @returns {Response}
 */
export function errorResponse(message, status = 400, headers = {}) {
  return json({ error: message }, status, headers);
}

/**
 * Enforces allowed HTTP methods and handles preflight OPTIONS requests.
 * @param {Request} req
 * @param {string[]} allowedMethods - E.g. ['GET'] or ['POST']
 * @returns {Response | null} Response to return immediately, or null if method is permitted.
 */
export function methodGuard(req, allowedMethods) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: { ...SECURE_DEFAULT_HEADERS }
    });
  }

  if (!allowedMethods.includes(req.method)) {
    return errorResponse(`Method ${req.method} not allowed`, 405, {
      Allow: allowedMethods.concat('OPTIONS').join(', ')
    });
  }

  return null;
}

/**
 * Safely parses request JSON with strict size limits.
 * @param {Request} req
 * @param {number} [maxSizeBytes=MAX_BODY_SIZE_BYTES]
 * @returns {Promise<{ valid: boolean, data?: any, error?: string }>}
 */
export async function safeParseJson(req, maxSizeBytes = MAX_BODY_SIZE_BYTES) {
  try {
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > maxSizeBytes) {
      return { valid: false, error: 'Request payload exceeds maximum size limit (10 KB)' };
    }

    const text = await req.text();
    if (!text || !text.trim()) {
      return { valid: false, error: 'Empty request body' };
    }

    if (new TextEncoder().encode(text).length > maxSizeBytes) {
      return { valid: false, error: 'Request payload exceeds maximum size limit (10 KB)' };
    }

    const data = JSON.parse(text);
    return { valid: true, data };
  } catch {
    return { valid: false, error: 'Malformed JSON payload' };
  }
}

/**
 * Legacy compatibility alias for safeParseJson().
 */
export const parseJsonBody = safeParseJson;
