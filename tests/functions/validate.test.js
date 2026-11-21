import { describe, it, expect } from 'vitest';
import {
  isValidLocation,
  isValidLat,
  isValidLon,
  validateCityQuery,
  validateProfilePayload,
  validateChatPayload,
  parseJsonBody
} from '../../netlify/functions/lib/validate.js';

describe('Validation Utilities & Security Guardrails', () => {
  describe('Geographic coordinate validation', () => {
    it('validates latitudes within [-90, 90]', () => {
      expect(isValidLat(0)).toBe(true);
      expect(isValidLat(28.6139)).toBe(true);
      expect(isValidLat(-45.0)).toBe(true);
      expect(isValidLat('12.34')).toBe(true);
      expect(isValidLat(90.1)).toBe(false);
      expect(isValidLat(-95)).toBe(false);
      expect(isValidLat(NaN)).toBe(false);
      expect(isValidLat('not-a-number')).toBe(false);
    });

    it('validates longitudes within [-180, 180]', () => {
      expect(isValidLon(0)).toBe(true);
      expect(isValidLon(77.209)).toBe(true);
      expect(isValidLon(-122.4194)).toBe(true);
      expect(isValidLon('100.5')).toBe(true);
      expect(isValidLon(180.1)).toBe(false);
      expect(isValidLon(-185)).toBe(false);
      expect(isValidLon(null)).toBe(false);
    });
  });

  describe('validateCityQuery', () => {
    it('accepts valid city queries', () => {
      const res = validateCityQuery('New Delhi');
      expect(res.valid).toBe(true);
      expect(res.sanitized).toBe('New Delhi');
    });

    it('strips invisible and malicious control characters', () => {
      const malicious = 'Delhi\x00\x08\x1B\x7F';
      const res = validateCityQuery(malicious);
      expect(res.valid).toBe(true);
      expect(res.sanitized).toBe('Delhi');
    });

    it('rejects short or oversized queries', () => {
      expect(validateCityQuery('A').valid).toBe(false);
      expect(validateCityQuery('   ').valid).toBe(false);
      expect(validateCityQuery('x'.repeat(81)).valid).toBe(false);
    });

    it('handles non-string types safely', () => {
      // @ts-expect-error test number
      expect(validateCityQuery(12345).valid).toBe(false);
      // @ts-expect-error test null
      expect(validateCityQuery(null).valid).toBe(false);
    });
  });

  describe('validateProfilePayload', () => {
    it('reuses domain profile validation as single source of truth', () => {
      const result = validateProfilePayload({
        location: { name: 'Mumbai', lat: 19.076, lon: 72.8777 },
        household: { adults: 2, children: 1 },
        budget: 'low'
      });
      expect(result.valid).toBe(true);
      expect(result.value.location.name).toBe('Mumbai');
      expect(result.value.budget).toBe('low');
    });
  });

  describe('validateChatPayload', () => {
    it('validates legitimate chat questions', () => {
      const payload = {
        message: 'How should I protect my kids during winter smog?',
        history: [{ role: 'user', text: 'Hello' }],
        context: { aqi: 220 }
      };
      const res = validateChatPayload(payload);
      expect(res.valid).toBe(true);
      expect(res.sanitized?.message).toBe('How should I protect my kids during winter smog?');
      expect(res.sanitized?.history).toHaveLength(1);
    });

    it('rejects empty or oversized messages (>500 chars)', () => {
      expect(validateChatPayload({ message: '' }).valid).toBe(false);
      expect(validateChatPayload({ message: 'x'.repeat(501) }).valid).toBe(false);
    });

    it('rejects history with >10 items or invalid roles', () => {
      const excessiveHistory = Array.from({ length: 11 }).map((_, i) => ({
        role: 'user',
        text: `Message ${i}`
      }));
      expect(validateChatPayload({ message: 'Hi', history: excessiveHistory }).valid).toBe(false);

      const invalidRole = [{ role: 'system_admin', text: 'inject' }];
      expect(validateChatPayload({ message: 'Hi', history: invalidRole }).valid).toBe(false);
    });
  });

  describe('Legacy compatibility helpers', () => {
    it('isValidLocation validates location strings', () => {
      expect(isValidLocation('New Delhi')).toBe(true);
      expect(isValidLocation('LA')).toBe(true);
      expect(isValidLocation('A')).toBe(false);
      expect(isValidLocation('')).toBe(false);
      expect(isValidLocation(null)).toBe(false);
    });

    it('parseJsonBody parses valid JSON', async () => {
      const mockRequest = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ test: 123 })
      });
      const result = await parseJsonBody(mockRequest);
      expect(result.valid).toBe(true);
      expect(result.data).toEqual({ test: 123 });
    });
  });
});
