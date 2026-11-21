import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from '../../netlify/functions/chat.js';

describe('CleanAir Chat Assistant API Function', () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test_mock_gemini_key';
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env.GEMINI_API_KEY = originalKey;
  });

  it('responds with AI reply for valid air pollution queries', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: 'Wear a well-fitted N95 respirator and avoid morning exercise.' }]
            }
          }
        ]
      })
    });

    const payload = {
      message: 'What mask should I wear today in high smog?',
      context: { aqi: 195 }
    };

    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const res = await handler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.reply).toContain('N95 respirator');
  });

  it('returns safe fallback guidance when AI call times out or fails', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Connection timeout'));

    const payload = {
      message: 'Is it safe to run outdoors today?'
    };

    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const res = await handler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.fallback).toBe(true);
    expect(data.reply).toContain('offline mode');
  });

  it('rejects oversized or invalid messages with 400', async () => {
    const payload = {
      message: 'x'.repeat(550)
    };

    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const res = await handler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('exceeds maximum length');
  });
});
