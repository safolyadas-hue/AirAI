/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderTodayView } from '../../public/js/ui/today/index.js';
import { renderPlanView } from '../../public/js/ui/plan.js';
import { renderIndoorView } from '../../public/js/ui/indoor.js';
import { renderSwapsView } from '../../public/js/ui/swaps.js';

describe('Step 6 Views: Today, Plan, Indoor, Swaps', () => {
  let container;

  beforeEach(() => {
    document.body.innerHTML =
      '<div id="a11y-announcements" aria-live="polite"></div><div id="mount"></div>';
    container = document.getElementById('mount');
  });

  it('renders AI prompt-injection text as inert textContent in Today and Plan', () => {
    const injection = '<script>window.__xss=1</script><img src=x onerror=alert(1)>';
    renderTodayView(container, {
      vm: {
        status: 'ready',
        aqi: 320,
        categoryKey: 'hazardous',
        categoryLabel: 'Hazardous',
        locationName: 'Delhi',
        airSnapshot: {
          aqi: 320,
          pm2_5: 250,
          pm10: 400,
          no2: 80,
          o3: 20,
          dominantPollutant: { pollutant: 'pm2_5' }
        },
        headline: injection,
        familyNarrative: injection,
        stagnation: { risk: 'high', windSpeed: 2, temperature: 7, humidity: 85 },
        safetyBanner: { show: true, isSevere: true },
        hourlyPoints: [],
        hourlyAnalysis: null,
        topActions: [],
        allPlanActions: [],
        adviceStatus: 'ready',
        lastUpdatedAt: Date.now()
      }
    });

    expect(container.querySelectorAll('script').length).toBe(0);
    expect(container.querySelectorAll('img').length).toBe(0);
    expect(container.textContent).toContain('<script>');
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
  });

  it('renders Plan view with 5 blocks, progressbar, done checkbox, and null-impact action', () => {
    renderPlanView(container, {
      vm: {
        totalActions: 1,
        blocks: [
          {
            id: 'morning',
            aiNote: 'AI morning note',
            actions: [
              {
                id: 'act-1',
                title: 'Wet mop',
                why: 'Traps dust',
                effort: 'low',
                costTier: 'free',
                impact: null
              }
            ]
          },
          { id: 'commute', aiNote: null, actions: [] },
          { id: 'midday', aiNote: null, actions: [] },
          { id: 'evening', aiNote: null, actions: [] },
          { id: 'night', aiNote: null, actions: [] }
        ]
      }
    });

    expect(container.textContent).toContain('0 of 1 actions done today');
    const bar = container.querySelector('[role="progressbar"]');
    expect(bar?.getAttribute('aria-valuenow')).toBe('0');

    const cb = /** @type {HTMLInputElement} */ (container.querySelector('#plan-done-act-1'));
    cb.checked = true;
    cb.dispatchEvent(new Event('change'));
    expect(container.textContent).toContain('1 of 1 actions done today');
  });

  it('renders Indoor Air DIY Corsi-Rosenthal SVG, ventilation, safety, checklist, and AI tips', () => {
    renderIndoorView(container, {
      vm: {
        groups: {
          free: [
            {
              id: 'a1',
              category: 'indoor',
              costTier: 'free',
              title: 'Seal drafts',
              why: 'Blocks smog',
              impact: null
            }
          ],
          low: [],
          invest: []
        },
        diyProminent: true,
        ventilation: { hasSafeWindow: false, bestWindow: { time: '14:00', aqi: 135 } },
        cookingHeating: { cooking: 'lpg', heating: 'wood_biomass' },
        aiIndoorTips: ['Use damp towel on sill']
      }
    });

    expect(container.querySelector('svg title')?.textContent).toContain('Corsi-Rosenthal');
    expect(container.textContent).toContain('Keep windows closed today');
    expect(container.textContent).toContain('Room-by-Room Quick Checklist');
    expect(container.textContent).toContain('Use damp towel on sill');
  });

  it('renders Greener Swaps areas and community 100-household estimates', () => {
    renderSwapsView(container, {
      vm: {
        groups: {
          commute: [
            {
              id: 'clean-commute-swap',
              costTier: 'free',
              effort: 'medium',
              title: 'Take Metro',
              why: 'Cuts exhaust',
              impact: { co2KgPerWeek: 17.1, pm25ReductionRange: { min: 20, max: 40 } }
            }
          ],
          cooking: [],
          heating: []
        },
        communityActions: [
          {
            id: 'no-idling',
            communityEstimate: 'If 100 households pledge: ~240 kg CO₂/week avoided'
          }
        ],
        aiSwaps: ['Try carpooling twice a week']
      }
    });

    expect(container.textContent).toContain('Take Metro');
    expect(container.textContent).toContain('If 100 households pledge');
    expect(container.textContent).toContain('Try carpooling twice a week');
  });
});
