/**
 * Google Gemini Generative AI Client
 * Native fetch integration with typed failure classification, per-call timeout, and retry handling.
 */

export const GEMINI_CONFIG = Object.freeze({
  DEFAULT_MODEL: 'gemini-2.5-flash',
  ADVICE_TIMEOUT_MS: 20000, // 20s timeout for advice (large structured output)
  CHAT_TIMEOUT_MS: 12000, // 12s timeout for chat
  DEFAULT_TIMEOUT_MS: 12000,
  RETRY_DELAY_MS: 500, // 500ms before retry on 5xx
  ADVICE_MAX_OUTPUT_TOKENS: 1200, // Token cap for structured advice
  CHAT_MAX_OUTPUT_TOKENS: 400 // Token cap for concise chat replies
});

const DEFAULT_MODEL = GEMINI_CONFIG.DEFAULT_MODEL;
const DEFAULT_TIMEOUT_MS = GEMINI_CONFIG.DEFAULT_TIMEOUT_MS;
const RETRY_DELAY_MS = GEMINI_CONFIG.RETRY_DELAY_MS;

/**
 * Standard classification reasons for Gemini API failures
 * @typedef {'missing_key' | 'timeout' | 'http_error' | 'invalid_json' | 'schema_mismatch' | 'empty_response'} GeminiFailureReason
 */

/**
 * Typed Error for classified Gemini operations.
 * Never includes API keys, request bodies, or user content in error messages.
 */
export class GeminiError extends Error {
  /**
   * @param {GeminiFailureReason} reason - Classified failure reason.
   * @param {string} message - Sanitized error message without user content or secrets.
   * @param {number} [status] - Optional HTTP status code for http_error.
   */
  constructor(reason, message, status) {
    super(message);
    this.name = 'GeminiError';
    this.reason = reason;
    this.status = status;
  }
}

/**
 * Normalizes any caught error into a typed GeminiError.
 * @param {unknown} err
 * @returns {GeminiError}
 */
export function classifyGeminiError(err) {
  if (err instanceof GeminiError) {
    return err;
  }
  if (err instanceof Error && (err.name === 'AbortError' || /timeout/i.test(err.message))) {
    return new GeminiError('timeout', 'Gemini API request timed out');
  }
  if (
    err instanceof SyntaxError ||
    (err instanceof Error && /invalid json|JSON\.parse/i.test(err.message))
  ) {
    return new GeminiError('invalid_json', 'Gemini response is not valid JSON');
  }
  if (err instanceof Error && /schema|missing required/i.test(err.message)) {
    return new GeminiError('schema_mismatch', 'Gemini response schema mismatch');
  }
  if (err instanceof Error && /empty response|no candidate/i.test(err.message)) {
    return new GeminiError('empty_response', 'Empty response candidate returned from Gemini');
  }
  if (err instanceof Error && /missing.*key|API_KEY/i.test(err.message)) {
    return new GeminiError('missing_key', 'GEMINI_API_KEY environment variable is not configured');
  }
  const message = err instanceof Error ? err.message : 'Unknown Gemini error';
  const statusMatch = message.match(/\b(4\d\d|5\d\d)\b/);
  const status = statusMatch ? parseInt(statusMatch[1], 10) : undefined;
  return new GeminiError('http_error', message, status);
}

/**
 * Sleeps for a designated millisecond duration.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Validates that an API key is configured and non-placeholder.
 * @param {string | undefined} key
 * @returns {string} Valid API key.
 */
function resolveApiKey(key) {
  if (!key || typeof key !== 'string' || !key.trim() || key === 'your_gemini_api_key_here') {
    throw new GeminiError('missing_key', 'GEMINI_API_KEY environment variable is not configured');
  }
  return key.trim();
}

/**
 * Validates parsed JSON output against required fields.
 * @param {string} textOutput
 * @param {string[]} [requiredKeys]
 * @returns {string} Valid JSON text.
 */
function validateJsonOutput(textOutput, requiredKeys) {
  let parsed;
  try {
    parsed = JSON.parse(textOutput);
  } catch {
    throw new GeminiError('invalid_json', 'Gemini response is not valid JSON');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new GeminiError('schema_mismatch', 'Gemini response is not a valid JSON object');
  }

  if (Array.isArray(requiredKeys)) {
    for (const key of requiredKeys) {
      if (parsed[key] === undefined || parsed[key] === null) {
        throw new GeminiError(
          'schema_mismatch',
          `Gemini response missing required schema property: ${key}`
        );
      }
    }
  }

  return textOutput;
}

/**
 * Calls the Gemini API with timeout, single 5xx retry, and typed error classification.
 * Never retries on timeout to avoid compounding latency.
 * @param {string} prompt - User prompt text.
 * @param {string} [systemInstruction=''] - Optional system prompt.
 * @param {Object} [options={}]
 * @param {boolean} [options.jsonMode=false] - Whether to enforce application/json output.
 * @param {object} [options.responseSchema] - Optional JSON schema for structured generation.
 * @param {string[]} [options.requiredKeys] - Array of expected top-level keys for schema validation.
 * @param {number} [options.timeoutMs=DEFAULT_TIMEOUT_MS] - Millisecond timeout.
 * @param {number} [options.maxOutputTokens] - Optional maximum token length cap.
 * @returns {Promise<string>} Cleaned text response.
 */
export async function callGemini(prompt, systemInstruction = '', options = {}) {
  const apiKey = resolveApiKey(process.env.GEMINI_API_KEY);
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const timeoutMs =
    typeof options.timeoutMs === 'number' && options.timeoutMs > 0
      ? options.timeoutMs
      : DEFAULT_TIMEOUT_MS;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }]
  };

  if (systemInstruction) {
    payload.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  if (options.jsonMode || options.responseSchema || typeof options.maxOutputTokens === 'number') {
    payload.generationConfig = {};
    if (options.jsonMode || options.responseSchema) {
      payload.generationConfig.responseMimeType = 'application/json';
    }
    if (options.responseSchema) {
      payload.generationConfig.responseSchema = options.responseSchema;
    }
    if (typeof options.maxOutputTokens === 'number' && options.maxOutputTokens > 0) {
      payload.generationConfig.maxOutputTokens = options.maxOutputTokens;
    }
  }

  let attempts = 0;
  let lastError = null;

  while (attempts < 2) {
    attempts += 1;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textOutput || !textOutput.trim()) {
          throw new GeminiError('empty_response', 'Empty response candidate returned from Gemini');
        }

        const trimmed = textOutput.trim();
        if (options.jsonMode || options.responseSchema || options.requiredKeys) {
          validateJsonOutput(trimmed, options.requiredKeys);
        }
        return trimmed;
      }

      // Single retry strictly on 5xx server errors
      if (response.status >= 500 && attempts === 1) {
        await wait(RETRY_DELAY_MS);
        continue;
      }

      throw new GeminiError(
        'http_error',
        `Gemini API error (HTTP ${response.status})`,
        response.status
      );
    } catch (err) {
      clearTimeout(timeoutId);
      const isAbort = err instanceof Error && err.name === 'AbortError';
      lastError = isAbort
        ? new GeminiError('timeout', 'Gemini API request timed out')
        : classifyGeminiError(err);

      // Do NOT retry on timeout, client errors, or after max attempts
      if (isAbort || lastError.reason === 'timeout' || attempts >= 2) {
        break;
      }

      if (attempts === 1 && lastError.status && lastError.status >= 500) {
        await wait(RETRY_DELAY_MS);
        continue;
      }

      break;
    }
  }

  throw lastError || new GeminiError('http_error', 'Failed to communicate with Gemini API');
}
