import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  GeminiError,
  classifyGeminiError,
  callGemini,
  GEMINI_CONFIG
} from '../../netlify/functions/lib/gemini.js';

describe('Gemini Client & Error Classification', () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'valid_test_key_123';
    delete process.env.GEMINI_MODEL;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env = { ...originalEnv };
  });

  describe('Configuration constants', () => {
    it('defines 20000ms for advice and 12000ms for chat', () => {
      expect(GEMINI_CONFIG.ADVICE_TIMEOUT_MS).toBe(20000);
      expect(GEMINI_CONFIG.CHAT_TIMEOUT_MS).toBe(12000);
      expect(GEMINI_CONFIG.ADVICE_MAX_OUTPUT_TOKENS).toBe(1200);
      expect(GEMINI_CONFIG.CHAT_MAX_OUTPUT_TOKENS).toBe(400);
    });
  });

  describe('classifyGeminiError', () => {
    it('returns original instance if already GeminiError', () => {
      const err = new GeminiError('schema_mismatch', 'Field missing', 422);
      expect(classifyGeminiError(err)).toBe(err);
    });

    it('classifies AbortError and timeout messages as timeout', () => {
      const abortErr = new Error('The operation was aborted');
      abortErr.name = 'AbortError';
      expect(classifyGeminiError(abortErr).reason).toBe('timeout');

      const timeoutErr = new Error('Connection timeout reached');
      expect(classifyGeminiError(timeoutErr).reason).toBe('timeout');
    });

    it('classifies SyntaxError as invalid_json', () => {
      const syntaxErr = new SyntaxError('Unexpected token < in JSON at position 0');
      expect(classifyGeminiError(syntaxErr).reason).toBe('invalid_json');
    });

    it('classifies schema validation messages as schema_mismatch', () => {
      const schemaErr = new Error('Gemini response missing required schema property: summary');
      expect(classifyGeminiError(schemaErr).reason).toBe('schema_mismatch');
    });

    it('classifies empty candidates as empty_response', () => {
      const emptyErr = new Error('Empty response candidate returned from Gemini');
      expect(classifyGeminiError(emptyErr).reason).toBe('empty_response');
    });

    it('classifies missing API key as missing_key', () => {
      const keyErr = new Error('GEMINI_API_KEY is not configured');
      expect(classifyGeminiError(keyErr).reason).toBe('missing_key');
    });

    it('extracts HTTP status codes into http_error', () => {
      const httpErr = new Error('Upstream failed with 503 service unavailable');
      const classified = classifyGeminiError(httpErr);
      expect(classified.reason).toBe('http_error');
      expect(classified.status).toBe(503);
    });
  });

  describe('callGemini failure handling and retry policy', () => {
    it('throws missing_key when API key is undefined, empty, or placeholder', async () => {
      delete process.env.GEMINI_API_KEY;
      await expect(callGemini('Hello')).rejects.toMatchObject({
        name: 'GeminiError',
        reason: 'missing_key'
      });

      process.env.GEMINI_API_KEY = '   ';
      await expect(callGemini('Hello')).rejects.toMatchObject({
        reason: 'missing_key'
      });

      process.env.GEMINI_API_KEY = 'your_gemini_api_key_here';
      await expect(callGemini('Hello')).rejects.toMatchObject({
        reason: 'missing_key'
      });
    });

    it('does NOT retry on timeout (calls fetch exactly once)', async () => {
      const fetchSpy = vi.fn().mockImplementation(() => {
        const err = new Error('The operation was aborted');
        err.name = 'AbortError';
        return Promise.reject(err);
      });
      globalThis.fetch = fetchSpy;

      await expect(callGemini('Hello', '', { timeoutMs: 50 })).rejects.toMatchObject({
        name: 'GeminiError',
        reason: 'timeout'
      });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('retries once on 5xx errors and succeeds on retry', async () => {
      const fetchSpy = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: async () => ({})
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: 'Recovered after retry' }] } }]
          })
        });
      globalThis.fetch = fetchSpy;

      const result = await callGemini('Hello');
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(result).toBe('Recovered after retry');
    });

    it('retries once on 5xx errors and throws if second attempt also fails', async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({})
      });
      globalThis.fetch = fetchSpy;

      await expect(callGemini('Hello')).rejects.toMatchObject({
        name: 'GeminiError',
        reason: 'http_error',
        status: 500
      });
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('does not retry on 4xx client errors', async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Bad request' } })
      });
      globalThis.fetch = fetchSpy;

      await expect(callGemini('Hello')).rejects.toMatchObject({
        name: 'GeminiError',
        reason: 'http_error',
        status: 400
      });
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('supports per-call timeout and maxOutputTokens payload configuration', async () => {
      let capturedBody = null;
      globalThis.fetch = vi.fn().mockImplementation((_url, init) => {
        capturedBody = JSON.parse(init.body);
        return Promise.resolve({
          ok: true,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: '{"summary":"ok"}' }] } }]
          })
        });
      });

      await callGemini('Prompt', 'System instruction', {
        timeoutMs: GEMINI_CONFIG.ADVICE_TIMEOUT_MS,
        maxOutputTokens: 1200,
        jsonMode: true
      });

      expect(capturedBody).toBeDefined();
      expect(capturedBody.generationConfig.maxOutputTokens).toBe(1200);
      expect(capturedBody.generationConfig.responseMimeType).toBe('application/json');
    });

    it('throws empty_response when candidate text is empty or blank', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: '   ' }] } }]
        })
      });

      await expect(callGemini('Hello')).rejects.toMatchObject({
        name: 'GeminiError',
        reason: 'empty_response'
      });
    });

    it('throws invalid_json when jsonMode output fails JSON parsing', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'NOT_VALID_JSON{[' }] } }]
        })
      });

      await expect(callGemini('Hello', '', { jsonMode: true })).rejects.toMatchObject({
        name: 'GeminiError',
        reason: 'invalid_json'
      });
    });

    it('throws schema_mismatch when requiredKeys are missing from JSON output', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: JSON.stringify({ other: 123 }) }] } }]
        })
      });

      await expect(
        callGemini('Hello', '', { jsonMode: true, requiredKeys: ['summary', 'dailyPlan'] })
      ).rejects.toMatchObject({
        name: 'GeminiError',
        reason: 'schema_mismatch'
      });
    });

    it('never leaks API key or prompt text in errors', async () => {
      const secretKey = 'super_secret_token_abcdef123';
      process.env.GEMINI_API_KEY = secretKey;
      const sensitivePrompt = 'Sensitive user medical prompt 98765';

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({})
      });

      try {
        await callGemini(sensitivePrompt);
        expect.unreachable('Should have thrown');
      } catch (err) {
        const str = String(err) + (err instanceof Error ? err.stack : '');
        expect(str).not.toContain(secretKey);
        expect(str).not.toContain(sensitivePrompt);
      }
    });
  });
});
