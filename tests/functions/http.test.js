import { describe, it, expect } from 'vitest';
import { jsonResponse, errorResponse } from '../../netlify/functions/lib/http.js';

describe('HTTP Response Helpers', () => {
  it('creates JSON response with default 200 status', async () => {
    const res = jsonResponse({ status: 'ok' });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/json');
    const json = await res.json();
    expect(json).toEqual({ status: 'ok' });
  });

  it('creates error responses with appropriate status', async () => {
    const res = errorResponse('Bad Request', 400);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toEqual({ error: 'Bad Request' });
  });
});
