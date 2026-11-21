/**
 * Google Gemini Generative AI Client
 * Native fetch integration with timeout, single 5xx retry, and secure key handling.
 */

const DEFAULT_MODEL = 'gemini-2.5-flash';
const DEFAULT_TIMEOUT_MS = 8000; // 8s timeout
const RETRY_DELAY_MS = 500; // 500ms before retry on 5xx

/**
 * Sleeps for a designated millisecond duration.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calls the Gemini API with timeout and single 5xx retry.
 * @param {string} prompt - User prompt text.
 * @param {string} [systemInstruction=''] - Optional system prompt.
 * @param {Object} [options={}]
 * @param {boolean} [options.jsonMode=false] - Whether to enforce application/json output.
 * @param {object} [options.responseSchema] - Optional JSON schema for structured generation.
 * @param {number} [options.timeoutMs=DEFAULT_TIMEOUT_MS] - Millisecond timeout.
 * @returns {Promise<string>}
 */
export async function callGemini(prompt, systemInstruction = '', options = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured');
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ]
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  if (options.jsonMode || options.responseSchema) {
    payload.generationConfig = {
      responseMimeType: 'application/json'
    };
    if (options.responseSchema) {
      payload.generationConfig.responseSchema = options.responseSchema;
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
        if (!textOutput) {
          throw new Error('Empty response candidate returned from Gemini');
        }
        return textOutput.trim();
      }

      // If server error (5xx) and first attempt, retry once
      if (response.status >= 500 && attempts === 1) {
        await wait(RETRY_DELAY_MS);
        continue;
      }

      const status = response.status;
      throw new Error(`Gemini API error (HTTP ${status})`);
    } catch (err) {
      clearTimeout(timeoutId);
      const isAbort = err instanceof Error && err.name === 'AbortError';
      lastError = isAbort ? new Error('Gemini API request timed out') : err;

      if (attempts === 1 && !isAbort) {
        await wait(RETRY_DELAY_MS);
        continue;
      }
      break;
    }
  }

  throw lastError || new Error('Failed to communicate with Gemini API');
}
