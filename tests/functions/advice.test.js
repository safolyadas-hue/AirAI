import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler, {
  createCompactAirSnapshot,
  trimRulesOutput
} from '../../netlify/functions/advice.js';

describe('Advice Generator API Function', () => {
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

  describe('Payload trimming helpers', () => {
    it('creates compact airSnapshot retaining only essential fields', () => {
      const bloated = {
        aqi: 185,
        pm2_5: 110,
        pm10: 220,
        co: 1.2,
        dominantPollutant: { pollutant: 'pm2_5', value: 110, ratio: 3.5 },
        extraData: 'some heavy metadata'
      };

      const compact = createCompactAirSnapshot(bloated);
      expect(compact).toEqual({
        aqi: 185,
        pm2_5: 110,
        dominantPollutant: 'pm2_5'
      });
    });

    it('trims rules output to top 6 actions sorted by priority', () => {
      const manyActions = [
        { id: 'act-4', title: 'Four', priority: 4, extra: 'bloat' },
        { id: 'act-1', title: 'One', priority: 1, extra: 'bloat' },
        { id: 'act-5', title: 'Five', priority: 5, extra: 'bloat' },
        { id: 'act-2', title: 'Two', priority: 2, extra: 'bloat' },
        { id: 'act-3', title: 'Three', priority: 3, extra: 'bloat' },
        { id: 'act-6', title: 'Six', priority: 6, extra: 'bloat' },
        { id: 'act-7', title: 'Seven', priority: 7, extra: 'bloat' }
      ];

      const trimmed = trimRulesOutput(manyActions, 6);
      expect(trimmed).toHaveLength(6);
      expect(trimmed.map((a) => a.id)).toEqual([
        'act-1',
        'act-2',
        'act-3',
        'act-4',
        'act-5',
        'act-6'
      ]);
      expect(trimmed[0].extra).toBeUndefined();
    });
  });

  it('generates structured advice via Gemini JSON mode', async () => {
    const mockAdvice = {
      summary:
        'Air has severe $\\text{PM}_{2.5}$ concentration at 150 $\\mu g/m^3$ for sensitive individuals.',
      familyNarrative:
        'Given your infant child and elderly parents, particulate exposure must be minimized.',
      dailyPlan: {
        morning: 'Keep windows sealed; damp mop all common rooms.',
        commute: 'Wear an N95 respirator if traveling outdoors in heavy traffic.',
        midday: 'Operate True HEPA filter in living areas on medium speed.',
        evening: 'Ensure kitchen exhaust hood is operating while cooking.',
        night: 'Run bedroom air filtration on quiet mode.'
      },
      indoorTips: ['Seal drafty door thresholds', 'Damp mop floors'],
      swaps: ['Switch personal car trips to electric transit'],
      impactExplanations: [
        { actionId: 'n95-respirator-protection', explanation: 'Blocks 70-85% of fine particles.' }
      ],
      motivation: 'Small clean air routines safeguard your family from long-term exposure.'
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify(mockAdvice) }] } }]
      })
    });

    const payload = {
      profile: {
        location: { name: 'New Delhi' },
        household: { adults: 2, children: 1, elderly: 1 },
        budget: 'medium'
      },
      airSnapshot: { aqi: 185, pm2_5: 110 },
      rulesOutput: [{ id: 'n95-respirator-protection', why: 'Blocks particles' }]
    };

    const req = new Request('http://localhost/api/advice', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const res = await handler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.fallback).toBe(false);
    expect(data.summary).toBe(
      'Air has severe PM2.5 concentration at 150 µg/m³ for sensitive individuals.'
    );
    expect(data.summary).not.toContain('$\\text{PM}_{2.5}$');
    expect(data.dailyPlan.morning).toBeDefined();

    // Verify fetch payload contains maxOutputTokens cap
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const callInit = globalThis.fetch.mock.calls[0][1];
    const sentBody = JSON.parse(callInit.body);
    expect(sentBody.generationConfig.maxOutputTokens).toBe(1200);
  });

  it('degrades gracefully to deterministic fallback on Gemini failure', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Gemini API 503 service unavailable'));

    const payload = {
      profile: {
        location: { name: 'Kolkata' },
        household: { adults: 2, children: 0 }
      },
      airSnapshot: { aqi: 210, pm2_5: 140 },
      rulesOutput: [{ id: 'smart-ventilation-air-cleaning', why: 'Seal gaps' }]
    };

    const req = new Request('http://localhost/api/advice', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const res = await handler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.fallback).toBe(true);
    expect(data.fallbackReason).toBe('http_error (503)');
    expect(data.summary).toContain('210');
    expect(data.dailyPlan).toBeDefined();
    expect(data.indoorTips.length).toBeGreaterThan(0);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[advice] fallback: http_error (HTTP 503)')
    );
  });

  it('reports missing_key fallbackReason when GEMINI_API_KEY is missing', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    delete process.env.GEMINI_API_KEY;

    const payload = {
      profile: { location: { name: 'Delhi' } },
      airSnapshot: { aqi: 150 }
    };

    const req = new Request('http://localhost/api/advice', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const res = await handler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.fallback).toBe(true);
    expect(data.fallbackReason).toBe('missing_key');
    expect(warnSpy).toHaveBeenCalledWith('[advice] fallback: missing_key');
  });

  it('rejects invalid or empty request payloads with 400', async () => {
    const req = new Request('http://localhost/api/advice', {
      method: 'POST',
      body: ''
    });
    const res = await handler(req);
    expect(res.status).toBe(400);
  });
});
