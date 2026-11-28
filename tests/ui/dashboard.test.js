/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderTodayView } from '../../public/js/ui/today/index.js';

describe('Today Dashboard View with Live Snapshot', () => {
  let container;

  beforeEach(() => {
    document.body.innerHTML = '<div id="mount"></div>';
    container = document.getElementById('mount');
  });

  it('renders AQI gauge, pollutant tiles, family & stagnation cards, timeline, top 3 actions, and fallback note', () => {
    renderTodayView(container, {
      vm: {
        status: 'ready',
        aqi: 192,
        categoryKey: 'unhealthy',
        categoryLabel: 'Unhealthy',
        locationName: 'Delhi',
        airSnapshot: {
          aqi: 192,
          pm2_5: 115.4,
          pm10: 220.1,
          no2: 64.2,
          o3: 32.0,
          dominantPollutant: { pollutant: 'pm2_5', value: 115.4, ratio: 1 }
        },
        headline: 'High Smog Alert for Sensitive Household',
        familyNarrative: 'Protect 2 adults and 1 child at US AQI 192.',
        stagnation: { risk: 'high', windSpeed: 3, temperature: 8, humidity: 82 },
        safetyBanner: { show: false, isSevere: false },
        hourlyPoints: [
          { time: '06:00', aqi: 210 },
          { time: '14:00', aqi: 130 }
        ],
        hourlyAnalysis: {
          bestWindow: { time: '14:00', aqi: 130 },
          worstWindow: { time: '06:00', aqi: 210 },
          stagnationRisk: 'high',
          dataPointsCount: 2
        },
        topActions: [
          {
            id: '1',
            category: 'protection',
            effort: 'low',
            title: 'Action 1',
            why: 'Why 1',
            impact: null
          },
          {
            id: '2',
            category: 'indoor',
            effort: 'low',
            title: 'Action 2',
            why: 'Why 2',
            impact: null
          },
          {
            id: '3',
            category: 'routine',
            effort: 'medium',
            title: 'Action 3',
            why: 'Why 3',
            impact: null
          }
        ],
        allPlanActions: [],
        adviceStatus: 'fallback',
        lastUpdatedAt: Date.now()
      }
    });

    const text = container.textContent || '';
    expect(text).toContain('192');
    expect(text).toContain('115.4 µg/m³');
    expect(text).toContain('What this means for your family');
    expect(text).toContain('Why smog is trapped today');
    expect(text).toContain('3 km/h');
    expect(text).toContain('Cleanest window: 14:00 (AQI 130)');
    expect(text).toContain('Action 1');
    expect(text).toContain('Action 3');
    expect(text).toContain('Showing smart rules-based guidance');
    expect(text).toContain('Print my family plan');
  });
});
