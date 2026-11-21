import { describe, it, expect } from 'vitest';
import { evaluateRules, determineRiskLevel, createHeadline } from '../../public/js/domain/rules.js';
import { createDefaultProfile } from '../../public/js/domain/profile.js';

describe('Rules Engine Domain Logic', () => {
  describe('determineRiskLevel', () => {
    it('returns low when AQI <= 50 and non-vulnerable', () => {
      expect(determineRiskLevel(35, false)).toBe('low');
      expect(determineRiskLevel(50, false)).toBe('low');
    });

    it('escalates to elevated at 51+ for vulnerable households', () => {
      expect(determineRiskLevel(55, true)).toBe('elevated');
      expect(determineRiskLevel(100, true)).toBe('elevated');
    });

    it('returns elevated at 101-150 for non-vulnerable', () => {
      expect(determineRiskLevel(120, false)).toBe('elevated');
      expect(determineRiskLevel(150, false)).toBe('elevated');
    });

    it('escalates to high at 151+ for vulnerable or 201+ for non-vulnerable', () => {
      expect(determineRiskLevel(160, true)).toBe('high');
      expect(determineRiskLevel(205, false)).toBe('high');
    });

    it('returns severe when AQI >= 301 (Hazardous) or >= 201 with vulnerable members', () => {
      expect(determineRiskLevel(220, true)).toBe('severe');
      expect(determineRiskLevel(301, false)).toBe('severe');
      expect(determineRiskLevel(450, false)).toBe('severe');
    });
  });

  describe('createHeadline', () => {
    it('generates appropriate headlines for each risk level', () => {
      expect(createHeadline('severe', 320, false)).toContain('Hazardous');
      expect(createHeadline('high', 180, true)).toContain('Sensitive Household');
      expect(createHeadline('elevated', 120, false)).toContain('Air Quality Degrading');
      expect(createHeadline('low', 30, false)).toContain('Clean Air Opportunity');
    });
  });

  describe('evaluateRules complete pipeline', () => {
    it('generates tailored guidance for a vulnerable family in heavy smog', () => {
      const profile = createDefaultProfile({
        location: { name: 'Delhi' },
        household: {
          adults: 2,
          children: 1,
          elderly: 1,
          pregnant: false,
          respiratoryCondition: true
        },
        commute: { mode: 'car', distanceKm: 15 },
        home: { type: 'apartment', heating: 'electric', cooking: 'lpg', hasPurifier: false },
        budget: 'low',
        exerciseOutdoors: true
      });

      const airSnapshot = { aqi: 220, pm2_5: 165 };
      const hourly = {
        bestWindow: { time: '14:00', aqi: 180 },
        worstWindow: { time: '07:00', aqi: 260 },
        stagnationRisk: 'high'
      };

      const result = evaluateRules(profile, airSnapshot, hourly);

      expect(result.riskLevel).toBe('severe');
      expect(result.vulnerableHousehold).toBe(true);
      expect(result.headline).toContain('Hazardous');
      expect(result.actions.length).toBeGreaterThan(0);

      // Actions must be sorted by priority ascending (1 first)
      for (let i = 0; i < result.actions.length - 1; i++) {
        expect(result.actions[i].priority).toBeLessThanOrEqual(result.actions[i + 1].priority);
      }

      const actionIds = result.actions.map((a) => a.id);
      expect(actionIds).toContain('n95-respirator-protection');
      expect(actionIds).toContain('vulnerable-household-care');
      expect(actionIds).toContain('smart-ventilation-air-cleaning');
    });

    it('recommends DIY Corsi-Rosenthal box for low budget homes without a purifier', () => {
      const profile = createDefaultProfile({
        home: { hasPurifier: false },
        budget: 'low'
      });

      const result = evaluateRules(profile, { aqi: 160 });
      const action = result.actions.find((a) => a.id === 'smart-ventilation-air-cleaning');
      expect(action).toBeDefined();
      expect(action?.why).toContain('Corsi-Rosenthal');
    });

    it('recommends opening windows when outdoor air is clean (AQI <= 50)', () => {
      const profile = createDefaultProfile();
      const result = evaluateRules(profile, { aqi: 35 });
      const action = result.actions.find((a) => a.id === 'ventilate-fresh-air');
      expect(action).toBeDefined();
      expect(action?.title).toContain('Open Windows');
    });

    it('recommends shifting exercise to best outdoor window when that window is clean', () => {
      const profile = createDefaultProfile({ exerciseOutdoors: true });
      const hourly = {
        bestWindow: { time: '14:00', aqi: 85 }
      };

      const result = evaluateRules(profile, { aqi: 125 }, hourly);
      const exerciseAction = result.actions.find((a) => a.id === 'shift-outdoor-exercise');
      expect(exerciseAction).toBeDefined();
      expect(exerciseAction?.title).toContain('Shift Workout to Clean Window (14:00)');
    });

    it('warns against biomass or solid fuel heating', () => {
      const profile = createDefaultProfile({
        home: { heating: 'wood_biomass', cooking: 'biomass' }
      });

      const result = evaluateRules(profile, { aqi: 120 });
      const heatingAction = result.actions.find((a) => a.id === 'clean-heating-alternatives');
      expect(heatingAction).toBeDefined();
      expect(heatingAction?.priority).toBe(1);
    });

    it('includes school guidance when children are present and AQI > 100', () => {
      const profile = createDefaultProfile({
        household: { adults: 2, children: 2, elderly: 0 }
      });

      const result = evaluateRules(profile, { aqi: 140 });
      const schoolAction = result.actions.find((a) => a.id === 'child-school-guidance');
      expect(schoolAction).toBeDefined();
    });

    it('supports legacy evaluateRules(aqi, profile) argument signature', () => {
      const legacyResult = evaluateRules(180, { hasVulnerableMembers: true, commuteMode: 'car' });
      expect(legacyResult.riskLevel).toBe('high');
      expect(legacyResult.actions.length).toBeGreaterThan(0);
    });
  });
});
