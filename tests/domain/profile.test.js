import { describe, it, expect } from 'vitest';
import {
  validateProfile,
  createDefaultProfile,
  isVulnerableHousehold,
  VALID_COMMUTE_MODES,
  VALID_HOME_TYPES,
  VALID_HEATING_MODES,
  VALID_COOKING_MODES,
  VALID_BUDGET_TIERS
} from '../../public/js/domain/profile.js';

describe('Profile Domain Logic', () => {
  it('exports frozen schema option sets', () => {
    expect(Object.isFrozen(VALID_COMMUTE_MODES)).toBe(true);
    expect(Object.isFrozen(VALID_HOME_TYPES)).toBe(true);
    expect(Object.isFrozen(VALID_HEATING_MODES)).toBe(true);
    expect(Object.isFrozen(VALID_COOKING_MODES)).toBe(true);
    expect(Object.isFrozen(VALID_BUDGET_TIERS)).toBe(true);
  });

  describe('createDefaultProfile', () => {
    it('creates a complete default profile with valid structure', () => {
      const profile = createDefaultProfile();
      expect(profile.location.name).toBe('Urban Area');
      expect(profile.location.lat).toBe(28.6139);
      expect(profile.location.lon).toBe(77.209);
      expect(profile.household.adults).toBe(1);
      expect(profile.household.children).toBe(0);
      expect(profile.household.elderly).toBe(0);
      expect(profile.household.pregnant).toBe(false);
      expect(profile.household.respiratoryCondition).toBe(false);
      expect(profile.commute.mode).toBe('public_transit');
      expect(profile.commute.distanceKm).toBe(10);
      expect(profile.home.type).toBe('apartment');
      expect(profile.home.heating).toBe('electric');
      expect(profile.home.cooking).toBe('induction');
      expect(profile.home.hasPurifier).toBe(false);
      expect(profile.home.windowsSealed).toBe(false);
      expect(profile.budget).toBe('medium');
      expect(profile.exerciseOutdoors).toBe(false);
    });

    it('accepts valid overrides', () => {
      const profile = createDefaultProfile({
        budget: 'high',
        exerciseOutdoors: true,
        household: { adults: 2, children: 1 }
      });
      expect(profile.budget).toBe('high');
      expect(profile.exerciseOutdoors).toBe(true);
      expect(profile.household.adults).toBe(2);
      expect(profile.household.children).toBe(1);
    });
  });

  describe('validateProfile', () => {
    it('validates a correct complete profile returning valid=true and empty errors', () => {
      const input = {
        location: { name: 'Kolkata', lat: 22.5726, lon: 88.3639 },
        household: {
          adults: 2,
          children: 1,
          elderly: 1,
          pregnant: false,
          respiratoryCondition: true
        },
        commute: { mode: 'cycle', distanceKm: 5 },
        home: {
          type: 'house',
          heating: 'none',
          cooking: 'induction',
          hasPurifier: true,
          windowsSealed: true
        },
        budget: 'low',
        exerciseOutdoors: true
      };

      const result = validateProfile(input);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.value.location.name).toBe('Kolkata');
      expect(result.value.household.children).toBe(1);
      expect(result.value.commute.mode).toBe('cycle');
      expect(result.value.hasVulnerableMembers).toBe(true);
      expect(result.value.hasAirPurifier).toBe(true);
    });

    it('never throws on null, undefined, strings, or numbers', () => {
      expect(() => validateProfile(null)).not.toThrow();
      expect(() => validateProfile(undefined)).not.toThrow();
      expect(() => validateProfile('bad input')).not.toThrow();
      expect(() => validateProfile(12345)).not.toThrow();

      const res = validateProfile(null);
      expect(res.valid).toBe(false);
      expect(res.value).toBeDefined();
      expect(res.value.location.name).toBe('Urban Area');
    });

    it('clamps numeric bounds (adults, lat, lon, distance)', () => {
      const result = validateProfile({
        location: { lat: 150, lon: -250 },
        household: { adults: 0, children: 50, elderly: -5 },
        commute: { distanceKm: 500 }
      });

      expect(result.value.location.lat).toBe(90);
      expect(result.value.location.lon).toBe(-180);
      expect(result.value.household.adults).toBe(1);
      expect(result.value.household.children).toBe(20);
      expect(result.value.household.elderly).toBe(0);
      expect(result.value.commute.distanceKm).toBe(300);
    });

    it('sanitizes invalid enums and records descriptive errors', () => {
      const result = validateProfile({
        commute: { mode: 'flying_car' },
        budget: 'unlimited'
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('commute mode'))).toBe(true);
      expect(result.errors.some((e) => e.includes('budget tier'))).toBe(true);
      expect(result.value.commute.mode).toBe('public_transit');
      expect(result.value.budget).toBe('medium');
    });

    it('supports legacy shorthand fields', () => {
      const result = validateProfile({
        location: 'Delhi',
        commuteMode: 'transit',
        hasVulnerableMembers: true,
        hasAirPurifier: true
      });

      expect(result.value.location.name).toBe('Delhi');
      expect(result.value.locationName).toBe('Delhi');
      expect(result.value.commute.mode).toBe('public_transit');
      expect(result.value.commuteMode).toBe('public_transit');
      expect(result.value.household.respiratoryCondition).toBe(true);
      expect(result.value.home.hasPurifier).toBe(true);
    });
  });

  describe('isVulnerableHousehold', () => {
    it('returns true when children are present', () => {
      expect(
        isVulnerableHousehold({
          adults: 2,
          children: 1,
          elderly: 0,
          pregnant: false,
          respiratoryCondition: false
        })
      ).toBe(true);
    });

    it('returns true when elderly are present', () => {
      expect(
        isVulnerableHousehold({
          adults: 1,
          children: 0,
          elderly: 1,
          pregnant: false,
          respiratoryCondition: false
        })
      ).toBe(true);
    });

    it('returns true when pregnancy is present', () => {
      expect(
        isVulnerableHousehold({
          adults: 1,
          children: 0,
          elderly: 0,
          pregnant: true,
          respiratoryCondition: false
        })
      ).toBe(true);
    });

    it('returns true when respiratory condition is present', () => {
      expect(
        isVulnerableHousehold({
          adults: 1,
          children: 0,
          elderly: 0,
          pregnant: false,
          respiratoryCondition: true
        })
      ).toBe(true);
    });

    it('returns false for healthy non-vulnerable households', () => {
      expect(
        isVulnerableHousehold({
          adults: 2,
          children: 0,
          elderly: 0,
          pregnant: false,
          respiratoryCondition: false
        })
      ).toBe(false);
    });

    it('handles null/undefined gracefully', () => {
      // @ts-expect-error test null
      expect(isVulnerableHousehold(null)).toBe(false);
      // @ts-expect-error test undefined
      expect(isVulnerableHousehold(undefined)).toBe(false);
    });
  });
});
