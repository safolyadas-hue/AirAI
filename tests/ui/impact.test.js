/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { selectImpactViewModel } from '../../public/js/app/selectors.js';
import {
  renderImpact,
  prefersReducedMotion,
  animateMetric
} from '../../public/js/ui/impact/index.js';
import { evaluateRules } from '../../public/js/domain/rules.js';
import { analyzeHourlyForecast } from '../../public/js/domain/hourly.js';
import { createDefaultProfile } from '../../public/js/domain/profile.js';

function makeState(aqi = 185, profileOverrides = {}) {
  const profile = createDefaultProfile({
    location: { name: 'Delhi', lat: 28.61, lon: 77.21 },
    ...profileOverrides
  });
  const hourly = analyzeHourlyForecast([
    { time: '14:00', aqi, pm25: 100, windSpeed: 4, temperature: 10, humidity: 75 }
  ]);
  const airSnapshot = { aqi, pm2_5: 100, pm10: 180 };
  const rules = evaluateRules(profile, airSnapshot, hourly);
  return { profile, air: { airSnapshot, hourly: [] }, hourly, rules };
}

describe('Impact What-If Selectors & Dashboard UI', () => {
  let container;

  beforeEach(() => {
    document.body.innerHTML = '<div id="a11y-announcements"></div><div id="mount"></div>';
    container = document.getElementById('mount');
  });

  it('returns empty state when air data is missing and preselects top 5 when present', () => {
    expect(selectImpactViewModel({ air: null, rules: null }).hasData).toBe(false);

    const state = makeState(220, {
      household: {
        adults: 2,
        children: 1,
        elderly: 0,
        pregnant: false,
        respiratoryCondition: true
      },
      commute: { mode: 'car', distanceKm: 15 },
      home: {
        type: 'house',
        heating: 'wood_biomass',
        cooking: 'lpg',
        hasPurifier: false,
        windowsSealed: false
      }
    });
    const vm = selectImpactViewModel(state);
    expect(vm.hasData).toBe(true);
    expect(vm.selectedIds.length).toBeLessThanOrEqual(5);
    expect(vm.summary.estimatedIndoorPm25ReductionPercent.max).toBeLessThanOrEqual(95);

    const emptySel = selectImpactViewModel(state, []);
    expect(emptySel.summary.actionCount).toBe(0);
    expect(emptySel.summary.totalCo2AvoidedKgWeekly).toBe(0);
  });

  it('renders SVG chart with title, desc, data table, and respects prefers-reduced-motion', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true }))
    );
    expect(prefersReducedMotion()).toBe(true);

    const numEl = document.createElement('span');
    animateMetric(numEl, 17.1, (v) => v.toFixed(1));
    expect(numEl.textContent).toBe('17.1');

    const state = makeState(185, {
      home: {
        type: 'apartment',
        heating: 'electric',
        cooking: 'lpg',
        hasPurifier: false,
        windowsSealed: false
      }
    });
    renderImpact(container, { selectModel: (ids) => selectImpactViewModel(state, ids) });

    expect(container.querySelector('svg[role="img"] title')?.textContent).toContain(
      'Illustrative estimate'
    );
    expect(container.querySelector('svg[role="img"] desc')?.textContent).toContain(
      'WHO 24h guideline'
    );
    expect(container.querySelector('table tbody')?.textContent).toContain('Without changes');
    expect(container.textContent).toContain('If 100 households');
  });
});
