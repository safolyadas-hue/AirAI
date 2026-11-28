/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStore } from '../../public/js/state/store.js';
import { createController } from '../../public/js/app/controller.js';

const SAMPLE_PROFILE = {
  location: { name: 'Delhi', lat: 28.61, lon: 77.21 },
  household: { adults: 2, children: 1, elderly: 0, pregnant: false, respiratoryCondition: false },
  commute: { mode: 'public_transit', distanceKm: 10 },
  home: {
    type: 'apartment',
    heating: 'electric',
    cooking: 'induction',
    hasPurifier: false,
    windowsSealed: false
  },
  budget: 'medium',
  exerciseOutdoors: false
};

const SAMPLE_AIR = {
  location: { name: 'Delhi', lat: 28.61, lon: 77.21 },
  airSnapshot: {
    aqi: 210,
    pm2_5: 135,
    pm10: 240,
    dominantPollutant: { pollutant: 'pm2_5', value: 135, ratio: 1 }
  },
  hourly: [
    { time: '06:00', aqi: 240, pm25: 160, windSpeed: 3, temperature: 8, humidity: 80 },
    { time: '14:00', aqi: 140, pm25: 55, windSpeed: 10, temperature: 16, humidity: 45 }
  ]
};

describe('Application Controller', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-aqi');
  });

  it('executes air -> hourly -> rules synchronously before async AI advice resolves', async () => {
    const store = createStore({ profile: null });
    let resolveAdvice;
    const api = {
      getAirQuality: vi.fn(async () => SAMPLE_AIR),
      getAdvice: vi.fn(
        () =>
          new Promise((resolve) => {
            resolveAdvice = resolve;
          })
      ),
      searchCity: vi.fn(async () => [])
    };

    const ctrl = createController({ store, api });
    const res = ctrl.submitProfile(SAMPLE_PROFILE);
    expect(res.valid).toBe(true);

    // Wait for air quality promise microtask
    await Promise.resolve();
    await Promise.resolve();

    const midState = store.get();
    expect(midState.status).toBe('ready');
    expect(midState.rules).not.toBeNull();
    expect(midState.hourly?.bestWindow?.time).toBe('14:00');
    expect(midState.adviceStatus).toBe('loading');
    expect(document.documentElement.getAttribute('data-aqi')).toBe('very-unhealthy');

    resolveAdvice({ summary: 'AI tailored summary' });
    await Promise.resolve();
    await Promise.resolve();

    expect(store.get().adviceStatus).toBe('ready');
    expect(store.get().advice?.summary).toBe('AI tailored summary');
  });

  it('ignores stale advice responses when profile changes mid-flight', async () => {
    const store = createStore({ profile: null });
    let resolveFirstAdvice;
    let callCount = 0;

    const api = {
      getAirQuality: vi.fn(async () => SAMPLE_AIR),
      getAdvice: vi.fn(() => {
        callCount += 1;
        if (callCount === 1) {
          return new Promise((resolve) => {
            resolveFirstAdvice = resolve;
          });
        }
        return Promise.resolve({ summary: 'Fresh advice' });
      }),
      searchCity: vi.fn(async () => [])
    };

    const ctrl = createController({ store, api });
    ctrl.submitProfile(SAMPLE_PROFILE);
    await Promise.resolve();
    await Promise.resolve();

    // Submit updated profile before first advice resolves
    ctrl.submitProfile({ ...SAMPLE_PROFILE, location: { name: 'Noida', lat: 28.53, lon: 77.39 } });
    await Promise.resolve();
    await Promise.resolve();

    // Now resolve the stale first advice
    resolveFirstAdvice({ summary: 'Stale advice' });
    await Promise.resolve();
    await Promise.resolve();

    expect(store.get().advice?.summary).toBe('Fresh advice');
  });

  it('sets adviceStatus to fallback when advice returns fallback: true', async () => {
    const store = createStore({ profile: null });
    const api = {
      getAirQuality: vi.fn(async () => SAMPLE_AIR),
      getAdvice: vi.fn(async () => ({ fallback: true, fallbackReason: 'timeout' })),
      searchCity: vi.fn(async () => [])
    };

    const ctrl = createController({ store, api });
    ctrl.submitProfile(SAMPLE_PROFILE);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(store.get().adviceStatus).toBe('fallback');
  });

  it('tracks online/offline events in the store', () => {
    const store = createStore({ profile: null, isOffline: false });
    const api = { getAirQuality: vi.fn(), getAdvice: vi.fn(), searchCity: vi.fn() };
    const ctrl = createController({ store, api });
    const cleanup = ctrl.init();

    window.dispatchEvent(new Event('offline'));
    expect(store.get().isOffline).toBe(true);

    window.dispatchEvent(new Event('online'));
    expect(store.get().isOffline).toBe(false);

    cleanup();
  });
});
