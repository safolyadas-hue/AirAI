/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import {
  selectTodayViewModel,
  selectPlanViewModel,
  selectIndoorViewModel,
  selectSwapsViewModel
} from '../../public/js/app/selectors.js';
import { evaluateRules } from '../../public/js/domain/rules.js';
import { analyzeHourlyForecast } from '../../public/js/domain/hourly.js';
import { createDefaultProfile } from '../../public/js/domain/profile.js';

function buildState(profileOverrides, aqi, advice = null, adviceStatus = 'idle') {
  const profile = createDefaultProfile({
    location: { name: 'Delhi', lat: 28.61, lon: 77.21 },
    ...profileOverrides
  });
  const hourlyArr = [
    { time: '06:00', aqi: aqi + 15, pm25: 90, windSpeed: 3, temperature: 8, humidity: 78 },
    {
      time: '14:00',
      aqi: Math.max(20, aqi - 30),
      pm25: 40,
      windSpeed: 9,
      temperature: 16,
      humidity: 48
    }
  ];
  const hourly = analyzeHourlyForecast(hourlyArr);
  const airSnapshot = {
    aqi,
    pm2_5: 110,
    pm10: 210,
    no2: 50,
    o3: 35,
    dominantPollutant: { pollutant: 'pm2_5', value: 110, ratio: 1 }
  };
  const rules = evaluateRules(profile, airSnapshot, hourly);

  return {
    profile,
    air: { location: profile.location, airSnapshot, hourly: hourlyArr },
    hourly,
    rules,
    advice,
    adviceStatus,
    status: 'ready',
    lastUpdatedAt: Date.now()
  };
}

describe('View-Model Selectors', () => {
  it('handles missing advice and unknown action impact cleanly', () => {
    const state = buildState({}, 185, null, 'fallback');
    state.rules.actions.push({
      id: 'custom-unknown',
      category: 'indoor',
      timeOfDay: 'midday',
      title: 'Custom',
      why: 'Custom why',
      effort: 'low',
      costTier: 'free',
      priority: 5
    });

    const todayVm = selectTodayViewModel(state);
    expect(todayVm.familyNarrative).toContain('US AQI 185');
    const planVm = selectPlanViewModel(state);
    const custom = planVm.blocks.flatMap((b) => b.actions).find((a) => a.id === 'custom-unknown');
    expect(custom?.impact).toBeNull();
  });

  it('Persona 1: toddler + respiratory condition in Hazardous air (AQI 340)', () => {
    const state = buildState(
      {
        household: {
          adults: 2,
          children: 1,
          elderly: 0,
          pregnant: false,
          respiratoryCondition: true
        },
        home: {
          type: 'apartment',
          heating: 'electric',
          cooking: 'induction',
          hasPurifier: false,
          windowsSealed: false
        }
      },
      340
    );

    const todayVm = selectTodayViewModel(state);
    expect(todayVm.safetyBanner.show).toBe(true);
    expect(todayVm.safetyBanner.isSevere).toBe(true);

    const planIds = selectPlanViewModel(state).blocks.flatMap((b) => b.actions.map((a) => a.id));
    expect(planIds).toContain('n95-respirator-protection');
    expect(planIds).toContain('vulnerable-household-care');
    expect(planIds).toContain('child-school-guidance');

    const swapsVm = selectSwapsViewModel(state);
    expect(swapsVm.groups.cooking).toHaveLength(0);
  });

  it('Persona 2: healthy cyclist in Moderate air (AQI 78)', () => {
    const state = buildState(
      {
        household: {
          adults: 1,
          children: 0,
          elderly: 0,
          pregnant: false,
          respiratoryCondition: false
        },
        commute: { mode: 'cycle', distanceKm: 8 },
        exerciseOutdoors: true
      },
      78
    );

    const planIds = selectPlanViewModel(state).blocks.flatMap((b) => b.actions.map((a) => a.id));
    expect(planIds).not.toContain('n95-respirator-protection');
    expect(planIds).not.toContain('clean-commute-swap');
    expect(selectSwapsViewModel(state).groups.commute).toHaveLength(0);
  });

  it('Persona 3: elderly couple heating with wood in Unhealthy air (AQI 185)', () => {
    const state = buildState(
      {
        household: {
          adults: 0,
          children: 0,
          elderly: 2,
          pregnant: false,
          respiratoryCondition: false
        },
        home: {
          type: 'house',
          heating: 'wood_biomass',
          cooking: 'lpg',
          hasPurifier: false,
          windowsSealed: false
        }
      },
      185
    );

    const planIds = selectPlanViewModel(state).blocks.flatMap((b) => b.actions.map((a) => a.id));
    expect(planIds).toContain('clean-heating-alternatives');
    expect(planIds).toContain('vulnerable-household-care');
    expect(planIds).not.toContain('child-school-guidance');

    const swapsVm = selectSwapsViewModel(state);
    expect(swapsVm.groups.heating.length).toBeGreaterThan(0);
    expect(swapsVm.communityActions).toHaveLength(4);
  });

  it('Persona 4: work-from-home adult with a purifier in Good air (AQI 35)', () => {
    const state = buildState(
      {
        household: {
          adults: 1,
          children: 0,
          elderly: 0,
          pregnant: false,
          respiratoryCondition: false
        },
        commute: { mode: 'work_from_home', distanceKm: 0 },
        home: {
          type: 'apartment',
          heating: 'electric',
          cooking: 'induction',
          hasPurifier: true,
          windowsSealed: true
        }
      },
      35
    );

    const indoorVm = selectIndoorViewModel(state);
    expect(indoorVm.diyProminent).toBe(false);
    expect(indoorVm.ventilation.hasSafeWindow).toBe(true);

    const planIds = selectPlanViewModel(state).blocks.flatMap((b) => b.actions.map((a) => a.id));
    expect(planIds).toContain('ventilate-fresh-air');
    expect(planIds).not.toContain('n95-respirator-protection');
    expect(planIds).not.toContain('clean-commute-swap');
  });
});
