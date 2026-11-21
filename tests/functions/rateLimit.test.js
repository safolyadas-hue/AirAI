import { describe, it, expect } from 'vitest';
import {
  checkRateLimit,
  enforceRateLimit,
  RATE_LIMIT_CONFIG
} from '../../netlify/functions/lib/rateLimit.js';

describe('Rate Limiter Behavior', () => {
  it('allows requests within window threshold', () => {
    const testIp = '192.168.1.1';
    const result = checkRateLimit(`test:${testIp}`, 5, 1000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.retryAfterSeconds).toBe(0);
  });

  it('rejects bursts exceeding maximum requests and computes Retry-After', () => {
    const testIp = '192.168.1.2';
    const key = `test:${testIp}`;

    // Exhaust quota of 3 requests
    checkRateLimit(key, 3, 5000);
    checkRateLimit(key, 3, 5000);
    checkRateLimit(key, 3, 5000);

    const blocked = checkRateLimit(key, 3, 5000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('enforceRateLimit produces a 429 response with Retry-After header', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '203.0.113.195' }
    });

    // Exhaust AI limit (20 req)
    for (let i = 0; i < RATE_LIMIT_CONFIG.ai.maxRequests; i++) {
      enforceRateLimit(req, 'ai');
    }

    const response = enforceRateLimit(req, 'ai');
    expect(response).not.toBeNull();
    expect(response?.status).toBe(429);
    expect(response?.headers.get('Retry-After')).toBeDefined();
  });
});
