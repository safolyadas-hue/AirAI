/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  searchCity,
  getAirQuality,
  clearAirCache,
  ApiError
} from '../../public/js/services/api.js';

describe('API Service', () => {
  beforeEach(() => {
    clearAirCache();
    vi.restoreAllMocks();
  });

  it('searchCity builds URLSearchParams and returns results on success', async () => {
    const fetchMock = vi.fn(async (url) => {
      expect(String(url)).toContain('/api/air-quality?q=Delhi');
      return new Response(
        JSON.stringify({
          results: [
            { id: 1, name: 'Delhi', label: 'Delhi, India', latitude: 28.61, longitude: 77.21 }
          ]
        }),
        { status: 200 }
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    const results = await searchCity('Delhi');
    expect(results).toHaveLength(1);
    expect(results[0].label).toBe('Delhi, India');
  });

  it('maps AbortError to ApiError with kind timeout', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        const err = new Error('Aborted');
        err.name = 'AbortError';
        throw err;
      })
    );

    await expect(searchCity('Delhi')).rejects.toMatchObject({
      name: 'ApiError',
      kind: 'timeout'
    });
  });

  it('maps non-ok HTTP status to ApiError with kind http and status code', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('Server error', { status: 503 }))
    );

    try {
      await searchCity('Delhi');
      expect.unreachable('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.kind).toBe('http');
      expect(err.status).toBe(503);
    }
  });

  it('caches air quality by lat/lon rounded to 2 decimals and de-duplicates in-flight calls', async () => {
    let resolveFetch;
    const fetchMock = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveFetch = () =>
            resolve(
              new Response(
                JSON.stringify({
                  location: { name: 'Delhi', lat: 28.61, lon: 77.21 },
                  airSnapshot: { aqi: 180, pm2_5: 95, pm10: 190 },
                  hourly: []
                }),
                { status: 200 }
              )
            );
        })
    );
    vi.stubGlobal('fetch', fetchMock);

    // Concurrent identical calls share one in-flight fetch
    const p1 = getAirQuality(28.612, 77.209);
    const p2 = getAirQuality(28.612, 77.209);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    resolveFetch();

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1.airSnapshot.aqi).toBe(180);
    expect(r2.airSnapshot.aqi).toBe(180);

    // Rounded to 2 decimals (28.61, 77.21) hits 10-min cache
    const r3 = await getAirQuality(28.614, 77.211);
    expect(r3.airSnapshot.aqi).toBe(180);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
