import { describe, it, expect } from 'vitest';
import {
  ACTION_IMPACT_FACTORS,
  getEmissionFactor,
  getImpactBadgeTier
} from '../../public/js/domain/impactFactors.js';
import {
  estimateImpact,
  summarizeImpact,
  calculateEmissionsSaved,
  estimateIndoorPm25
} from '../../public/js/domain/impact.js';
import { createDefaultProfile } from '../../public/js/domain/profile.js';

describe('Impact Engine & Factors Domain Logic', () => {
  describe('ACTION_IMPACT_FACTORS table', () => {
    it('is frozen and documents scientific reduction ranges and assumptions', () => {
      expect(Object.isFrozen(ACTION_IMPACT_FACTORS)).toBe(true);
      const keys = Object.keys(ACTION_IMPACT_FACTORS);
      expect(keys.length).toBeGreaterThanOrEqual(8);

      keys.forEach((key) => {
        const factor =
          ACTION_IMPACT_FACTORS[/** @type {keyof typeof ACTION_IMPACT_FACTORS} */ (key)];
        expect(factor.pm25ReductionPercentRange.min).toBeGreaterThan(0);
        expect(factor.pm25ReductionPercentRange.max).toBeGreaterThanOrEqual(
          factor.pm25ReductionPercentRange.min
        );
        expect(['low', 'medium', 'high']).toContain(factor.confidence);
        expect(typeof factor.assumption).toBe('string');
        expect(factor.assumption.length).toBeGreaterThan(20);
      });
    });
  });

  describe('estimateImpact', () => {
    it('returns honest estimates with isEstimate=true and assumptions', () => {
      const est = estimateImpact('n95-respirator-protection');
      expect(est.isEstimate).toBe(true);
      expect(est.pm25ReductionPercentRange.min).toBe(70);
      expect(est.pm25ReductionPercentRange.max).toBe(85);
      expect(est.confidence).toBe('high');
      expect(est.assumption).toContain('N95');
    });

    it('tailors commute emissions avoidance to personalized distance', () => {
      const profile = createDefaultProfile({
        commute: { mode: 'car', distanceKm: 20 }
      });
      const est = estimateImpact('clean-commute-swap', profile);
      // 20km * 2 * 5 * (0.171 - 0.103 = 0.068) = 13.6 kg CO2
      expect(est.co2AvoidedKgWeekly).toBeGreaterThan(10);
    });

    it('handles unrecognized action keys with a safe conservative estimate', () => {
      const est = estimateImpact('unknown-custom-action');
      expect(est.isEstimate).toBe(true);
      expect(est.pm25ReductionPercentRange.min).toBe(15);
      expect(est.pm25ReductionPercentRange.max).toBe(30);
    });
  });

  describe('summarizeImpact', () => {
    it('aggregates total weekly CO2 avoided and peak PM2.5 reduction range', () => {
      const actions = [
        { id: 'n95-respirator-protection' },
        { id: 'smart-ventilation-air-cleaning' },
        { id: 'cooking-emission-control' }
      ];

      const summary = summarizeImpact(actions);
      expect(summary.isEstimate).toBe(true);
      expect(summary.actionCount).toBe(3);
      expect(summary.totalCo2AvoidedKgWeekly).toBe(4.5);
      expect(summary.estimatedIndoorPm25ReductionPercent.min).toBe(70);
      expect(summary.estimatedIndoorPm25ReductionPercent.max).toBe(85);
      expect(summary.disclaimer).toContain('modeled estimates');
    });

    it('handles empty actions list safely', () => {
      const summary = summarizeImpact([]);
      expect(summary.totalCo2AvoidedKgWeekly).toBe(0);
      expect(summary.estimatedIndoorPm25ReductionPercent.min).toBe(0);
      expect(summary.estimatedIndoorPm25ReductionPercent.max).toBe(0);
      expect(summary.actionCount).toBe(0);
      expect(summary.isEstimate).toBe(true);
    });
  });

  describe('Emission factors and badges', () => {
    it('returns appropriate emission factor by mode', () => {
      expect(getEmissionFactor('car')).toBe(0.171);
      expect(getEmissionFactor('public_transit')).toBe(0.103);
      expect(getEmissionFactor('cycle')).toBe(0);
      expect(getEmissionFactor('walk')).toBe(0);
    });

    it('assigns impact badge tiers based on kg CO2 avoided', () => {
      expect(getImpactBadgeTier(5)).toBe('bronze');
      expect(getImpactBadgeTier(15)).toBe('silver');
      expect(getImpactBadgeTier(60)).toBe('gold');
    });
  });

  describe('Legacy compatibility functions', () => {
    it('calculates avoided CO2 emissions for zero-emission commute', () => {
      const saved = calculateEmissionsSaved(10, 'bike');
      expect(saved).toBe(1.71);
    });

    it('calculates transit emission savings', () => {
      const saved = calculateEmissionsSaved(10, 'transit');
      expect(saved).toBe(1.03);
    });

    it('returns 0 for negative or invalid distances', () => {
      expect(calculateEmissionsSaved(0, 'bike')).toBe(0);
      expect(calculateEmissionsSaved(-5, 'bike')).toBe(0);
    });

    it('estimates indoor PM2.5 levels with and without filtration', () => {
      const outdoorPm25 = 100;
      const indoorWithFilter = estimateIndoorPm25(outdoorPm25, true);
      const indoorWithoutFilter = estimateIndoorPm25(outdoorPm25, false);

      expect(indoorWithFilter).toBe(15);
      expect(indoorWithoutFilter).toBe(70);
    });
  });
});
