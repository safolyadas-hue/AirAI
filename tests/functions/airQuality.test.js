import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from '../../netlify/functions/air-quality.js';

describe('Air Quality API Function', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('handles geocoding search queries, normalizing fields and building label', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            id: 1,
            name: 'Delhi',
            latitude: 28.61,
            longitude: 77.2,
            country: 'India',
            country_code: 'IN',
            admin1: 'NCT of Delhi',
            timezone: 'Asia/Kolkata',
            elevation: 216,
            feature_code: 'PPLA'
          },
          {
            id: 2,
            name: 'Monaco',
            latitude: 43.73,
            longitude: 7.42,
            country: 'Monaco',
            country_code: 'MC',
            admin1: undefined,
            timezone: 'Europe/Monaco',
            elevation: 10
          }
        ]
      })
    });

    const req = new Request('http://localhost/api/air-quality?q=Delhi');
    const res = await handler(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toContain('max-age=600');
    const data = await res.json();
    expect(data.results).toHaveLength(2);

    const first = data.results[0];
    expect(first).toEqual({
      id: 1,
      name: 'Delhi',
      latitude: 28.61,
      longitude: 77.2,
      admin1: 'NCT of Delhi',
      country: 'India',
      countryCode: 'IN',
      timezone: 'Asia/Kolkata',
      label: 'Delhi, NCT of Delhi, India'
    });
    // Ensure extraneous upstream fields are stripped
    expect(first.elevation).toBeUndefined();
    expect(first.feature_code).toBeUndefined();

    const second = data.results[1];
    expect(second.admin1).toBe('');
    expect(second.label).toBe('Monaco, Monaco');
  });

  it('fetches coordinates and normalizes responses into domain shapes', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('air-quality-api.open-meteo.com')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            current: {
              us_aqi: 185,
              pm2_5: 110.5,
              pm10: 165.0,
              nitrogen_dioxide: 45.0,
              ozone: 20.0,
              sulphur_dioxide: 10.0,
              carbon_monoxide: 1.5
            },
            hourly: {
              time: ['2026-11-21T12:00', '2026-11-21T13:00'],
              us_aqi: [185, 175],
              pm2_5: [110.5, 95.0]
            }
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          hourly: {
            time: ['2026-11-21T12:00', '2026-11-21T13:00'],
            temperature_2m: [8.5, 9.0],
            wind_speed_10m: [4.2, 3.8],
            relative_humidity_2m: [78, 82]
          }
        })
      });
    });

    const req = new Request('http://localhost/api/air-quality?lat=28.61&lon=77.20&name=Delhi');
    const res = await handler(req);

    expect(res.status).toBe(200);
    const data = await res.json();

    // Verify normalized airSnapshot shape
    expect(data.airSnapshot).toBeDefined();
    expect(data.airSnapshot.aqi).toBe(185);
    expect(data.airSnapshot.pm2_5).toBe(110.5);
    expect(data.airSnapshot.dominantPollutant?.pollutant).toBe('pm2_5');

    // Verify normalized hourly shape
    expect(data.hourly).toHaveLength(2);
    expect(data.hourly[0]).toEqual({
      time: '2026-11-21T12:00',
      aqi: 185,
      pm25: 110.5,
      windSpeed: 4.2,
      temperature: 8.5,
      humidity: 78
    });

    expect(data.location.name).toBe('Delhi');
    expect(data.aqi).toBe(185);
  });

  it('rejects invalid coordinates with 400 Bad Request', async () => {
    const req = new Request('http://localhost/api/air-quality?lat=120&lon=300');
    const res = await handler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Latitude must be -90..90');
  });

  it('handles upstream API failures gracefully with 502 status', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network connection timeout'));

    const req = new Request('http://localhost/api/air-quality?lat=28.61&lon=77.20');
    const res = await handler(req);
    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error).toContain('Unable to retrieve air quality data');
  });
});
