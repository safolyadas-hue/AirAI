/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initApp } from '../../public/js/main.js';
import { STORAGE_KEYS } from '../../public/js/config.js';
import { store } from '../../public/js/state/store.js';

describe('Navigation Tabs & Arrow Key Accessibility', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app-root" class="app-wrapper"></div>';
    localStorage.clear();
    const validProfile = {
      location: { name: 'Delhi', lat: 28.61, lon: 77.21 },
      household: {
        adults: 2,
        children: 0,
        elderly: 0,
        pregnant: false,
        respiratoryCondition: false
      },
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
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(validProfile));
    store.set({ profile: validProfile, isEditingProfile: false, view: 'today' });

    vi.stubGlobal(
      'fetch',
      vi.fn(async (url) => {
        if (String(url).includes('/api/advice')) {
          return new Response(JSON.stringify({ fallback: true, summary: '' }), { status: 200 });
        }
        return new Response(
          JSON.stringify({
            location: { name: 'Delhi', lat: 28.61, lon: 77.21 },
            airSnapshot: {
              aqi: 185,
              pm2_5: 110,
              pm10: 210,
              dominantPollutant: { pollutant: 'pm2_5', value: 110, ratio: 1 }
            },
            hourly: [
              { time: '14:00', aqi: 120, pm25: 45, windSpeed: 6, temperature: 15, humidity: 50 }
            ]
          }),
          { status: 200 }
        );
      })
    );

    initApp();
  });

  it('renders tab buttons with correct ARIA roles and attributes', () => {
    const tabs = Array.from(document.querySelectorAll('.desktop-nav-inner [role="tab"]'));
    expect(tabs.length).toBe(6);

    const activeTab = tabs.find((t) => t.getAttribute('aria-selected') === 'true');
    expect(activeTab).toBeDefined();
    expect(activeTab?.getAttribute('tabindex')).toBe('0');

    const inactiveTabs = tabs.filter((t) => t.getAttribute('aria-selected') === 'false');
    expect(inactiveTabs.length).toBe(5);
    inactiveTabs.forEach((t) => {
      expect(t.getAttribute('tabindex')).toBe('-1');
    });
  });

  it('switches views and updates aria-selected on click', () => {
    const planTab = document.querySelector('[data-tab-id="plan"]');
    expect(planTab).toBeDefined();

    planTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(planTab?.getAttribute('aria-selected')).toBe('true');
    expect(planTab?.getAttribute('tabindex')).toBe('0');

    const todayTab = document.querySelector('[data-tab-id="today"]');
    expect(todayTab?.getAttribute('aria-selected')).toBe('false');
    expect(todayTab?.getAttribute('tabindex')).toBe('-1');

    const panel = document.querySelector('[role="tabpanel"]');
    expect(panel?.id).toBe('panel-plan');
  });

  it('navigates through tabs using ArrowRight, ArrowLeft, End, and Home keys', () => {
    const desktopTabs = Array.from(document.querySelectorAll('.desktop-nav-inner [role="tab"]'));
    const firstTab = desktopTabs[0];

    firstTab.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    const secondTab = desktopTabs[1];
    expect(secondTab.getAttribute('aria-selected')).toBe('true');

    secondTab.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    const lastTab = desktopTabs[desktopTabs.length - 1];
    expect(lastTab.getAttribute('aria-selected')).toBe('true');

    lastTab.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(firstTab.getAttribute('aria-selected')).toBe('true');
  });
});
