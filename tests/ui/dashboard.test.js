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

  it('renders AQI gauge, pollutant tiles, timeline text summary, stagnation risk, top 3 actions, and fallback note', () => {
    renderTodayView(container, {
      status: 'ready',
      air: {
        location: { name: 'Delhi', lat: 28.61, lon: 77.21 },
        airSnapshot: {
          aqi: 192,
          pm2_5: 115.4,
          pm10: 220.1,
          no2: 64.2,
          o3: 32.0,
          dominantPollutant: { pollutant: 'pm2_5', value: 115.4, ratio: 1 }
        },
        hourly: [
          { time: '06:00', aqi: 210 },
          { time: '14:00', aqi: 130 }
        ]
      },
      hourly: {
        bestWindow: { time: '14:00', aqi: 130 },
        worstWindow: { time: '06:00', aqi: 210 },
        stagnationRisk: 'high',
        dataPointsCount: 2
      },
      rules: {
        riskLevel: 'high',
        vulnerableHousehold: true,
        headline: 'High Smog Alert for Sensitive Household',
        actions: [
          { id: '1', category: 'protection', effort: 'low', title: 'Action 1', why: 'Why 1' },
          { id: '2', category: 'indoor', effort: 'low', title: 'Action 2', why: 'Why 2' },
          { id: '3', category: 'routine', effort: 'medium', title: 'Action 3', why: 'Why 3' },
          { id: '4', category: 'swap', effort: 'medium', title: 'Action 4', why: 'Why 4' }
        ]
      },
      advice: { fallback: true, fallbackReason: 'timeout' },
      adviceStatus: 'fallback',
      categoryKey: 'unhealthy',
      categoryLabel: 'Unhealthy',
      lastUpdatedAt: Date.now()
    });

    const text = container.textContent || '';
    expect(text).toContain('192');
    expect(text).toContain('115.4 µg/m³');
    expect(text).toContain('Cleanest window: 14:00 (AQI 130)');
    expect(text).toContain('Stagnation risk is high');
    expect(text).toContain('Action 1');
    expect(text).toContain('Action 3');
    expect(text).not.toContain('Action 4'); // Top 3 priority actions only
    expect(text).toContain('Showing smart rules-based guidance');
    expect(text).not.toContain('timeout'); // Never expose technical fallbackReason
  });
});
