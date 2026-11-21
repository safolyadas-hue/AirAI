import { describe, it, expect } from 'vitest';
import {
  json,
  jsonResponse,
  errorResponse,
  methodGuard,
  safeParseJson,
  SECURE_DEFAULT_HEADERS,
  MAX_BODY_SIZE_BYTES
} from '../../netlify/functions/lib/http.js';

describe('HTTP Utilities & Security Headers', () => {
  it('creates JSON response with default 200 status and secure headers', async () => {
    expect(SECURE_DEFAULT_HEADERS['X-Content-Type-Options']).toBe('nosniff');
    const res = json({ status: 'ok' });
    expect(jsonResponse({ legacy: true }).status).toBe(200);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/json');
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('Cache-Control')).toBe('no-store, max-age=0');
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');

    const body = await res.json();
    expect(body).toEqual({ status: 'ok' });
  });

  it('creates error responses with appropriate status and body', async () => {
    const res = errorResponse('Bad Request', 400);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: 'Bad Request' });
  });

  it('methodGuard handles OPTIONS with 204 and allowed headers', () => {
    const optionsReq = new Request('http://localhost', { method: 'OPTIONS' });
    const response = methodGuard(optionsReq, ['POST']);
    expect(response).not.toBeNull();
    expect(response?.status).toBe(204);
  });

  it('methodGuard rejects disallowed HTTP methods with 405', async () => {
    const getReq = new Request('http://localhost', { method: 'GET' });
    const response = methodGuard(getReq, ['POST']);
    expect(response).not.toBeNull();
    expect(response?.status).toBe(405);
    expect(response?.headers.get('Allow')).toContain('POST, OPTIONS');
    const body = await response?.json();
    expect(body.error).toContain('Method GET not allowed');
  });

  it('methodGuard permits allowed HTTP methods', () => {
    const postReq = new Request('http://localhost', { method: 'POST' });
    const response = methodGuard(postReq, ['POST']);
    expect(response).toBeNull();
  });

  describe('safeParseJson', () => {
    it('parses valid JSON bodies', async () => {
      const req = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ name: 'CleanAir', val: 42 })
      });
      const result = await safeParseJson(req);
      expect(result.valid).toBe(true);
      expect(result.data).toEqual({ name: 'CleanAir', val: 42 });
    });

    it('rejects empty or whitespace-only bodies', async () => {
      const emptyReq = new Request('http://localhost', { method: 'POST', body: '   ' });
      const result = await safeParseJson(emptyReq);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Empty request body');
    });

    it('rejects malformed JSON', async () => {
      const malformedReq = new Request('http://localhost', { method: 'POST', body: '{badJson:' });
      const result = await safeParseJson(malformedReq);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Malformed JSON payload');
    });

    it('rejects bodies exceeding maximum size limit (10 KB)', async () => {
      const largePayload = { big: 'x'.repeat(MAX_BODY_SIZE_BYTES + 500) };
      const req = new Request('http://localhost', {
        method: 'POST',
        headers: { 'content-length': String(MAX_BODY_SIZE_BYTES + 600) },
        body: JSON.stringify(largePayload)
      });
      const result = await safeParseJson(req);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum size limit');
    });
  });
});
