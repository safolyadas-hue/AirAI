import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  GeminiError,
  classifyGeminiError,
  callGemini
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

  describe('callGemini failure handling', () => {
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

    it('throws timeout when network request is aborted', async () => {
      globalThis.fetch = vi.fn().mockImplementation(() => {
        const err = new Error('Request aborted');
        err.name = 'AbortError';
        return Promise.reject(err);
      });

      await expect(callGemini('Hello', '', { timeoutMs: 50 })).rejects.toMatchObject({
        name: 'GeminiError',
        reason: 'timeout'
      });
    });

    it('throws http_error with status code on 4xx/5xx failure', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: { message: 'Permission denied' } })
      });

      await expect(callGemini('Hello')).rejects.toMatchObject({
        name: 'GeminiError',
        reason: 'http_error',
        status: 403
      });
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
