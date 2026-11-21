import { describe, it, expect } from 'vitest';
import { isValidLocation, parseJsonBody } from '../../netlify/functions/lib/validate.js';

describe('API Validation Helpers', () => {
  it('validates location strings', () => {
    expect(isValidLocation('New Delhi')).toBe(true);
    expect(isValidLocation('LA')).toBe(true);
    expect(isValidLocation('A')).toBe(false);
    expect(isValidLocation('')).toBe(false);
    expect(isValidLocation(null)).toBe(false);
  });

  it('parses valid JSON bodies', async () => {
    const mockRequest = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ test: 123 })
    });
    const result = await parseJsonBody(mockRequest);
    expect(result.valid).toBe(true);
    expect(result.data).toEqual({ test: 123 });
  });

  it('catches empty or malformed JSON payloads', async () => {
    const emptyReq = new Request('http://localhost', { method: 'POST', body: '' });
    const emptyResult = await parseJsonBody(emptyReq);
    expect(emptyResult.valid).toBe(false);

    const malformedReq = new Request('http://localhost', { method: 'POST', body: '{badJson' });
    const malformedResult = await parseJsonBody(malformedReq);
    expect(malformedResult.valid).toBe(false);
  });
});
