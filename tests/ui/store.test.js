/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStore } from '../../public/js/state/store.js';
import { STORAGE_KEYS } from '../../public/js/config.js';

describe('Application Store', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists ONLY profile in localStorage and never air, advice, or chat', () => {
    const s = createStore({ profile: null });
    const profile = {
      location: { name: 'Delhi', lat: 28.61, lon: 77.21 },
      household: {
        adults: 2,
        children: 1,
        elderly: 0,
        pregnant: false,
        respiratoryCondition: false
      },
      commute: { mode: 'public_transit', distanceKm: 12 },
      home: {
        type: 'apartment',
        heating: 'electric',
        cooking: 'induction',
        hasPurifier: true,
        windowsSealed: true
      },
      budget: 'medium',
      exerciseOutdoors: false
    };

    s.set({
      profile,
      air: { airSnapshot: { aqi: 210, pm2_5: 130, pm10: 250 }, hourly: [] },
      advice: { summary: 'Stay indoors' },
      status: 'ready'
    });

    expect(localStorage.getItem(STORAGE_KEYS.PROFILE)).toContain('Delhi');
    expect(localStorage.length).toBe(1);
  });

  it('supports subscribe and unsubscribe', () => {
    const s = createStore({ profile: null });
    const spy = vi.fn();
    const unsub = s.subscribe(spy);

    s.set({ status: 'loading' });
    expect(spy).toHaveBeenCalledTimes(1);

    unsub();
    s.set({ status: 'ready' });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('discards corrupt or incomplete stored profile data', () => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, '{corrupt json');
    const s1 = createStore();
    expect(s1.get().profile).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.PROFILE)).toBeNull();

    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify({ household: { adults: 1 } }));
    const s2 = createStore();
    expect(s2.get().profile).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.PROFILE)).toBeNull();
  });
});
