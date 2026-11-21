import { describe, it, expect } from 'vitest';
import {
  AQI_CATEGORIES,
  getCategory,
  getDominantPollutant,
  getAqiCategory,
  getAqiColor,
  shouldLimitOutdoorActivity
} from '../../public/js/domain/aqi.js';

describe('AQI Domain Logic', () => {
  it('freezes AQI_CATEGORIES configuration array', () => {
    expect(Object.isFrozen(AQI_CATEGORIES)).toBe(true);
    expect(AQI_CATEGORIES.length).toBe(6);
    AQI_CATEGORIES.forEach((cat) => {
      expect(Object.isFrozen(cat)).toBe(true);
      expect(cat).toHaveProperty('id');
      expect(cat).toHaveProperty('label');
      expect(cat).toHaveProperty('colorToken');
      expect(cat).toHaveProperty('colorHex');
      expect(cat).toHaveProperty('shortMeaning');
      expect(cat).toHaveProperty('generalHealthMessage');
    });
  });

  describe('getCategory boundary tests', () => {
    it('handles Good range (0 - 50)', () => {
      expect(getCategory(0).id).toBe('good');
      expect(getCategory(25).id).toBe('good');
      expect(getCategory(50).id).toBe('good');
    });

    it('handles Moderate boundary (51 - 100)', () => {
      expect(getCategory(51).id).toBe('moderate');
      expect(getCategory(75).id).toBe('moderate');
      expect(getCategory(100).id).toBe('moderate');
    });

    it('handles Unhealthy for Sensitive Groups boundary (101 - 150)', () => {
      expect(getCategory(101).id).toBe('unhealthy_sensitive');
      expect(getCategory(125).id).toBe('unhealthy_sensitive');
      expect(getCategory(150).id).toBe('unhealthy_sensitive');
    });

    it('handles Unhealthy boundary (151 - 200)', () => {
      expect(getCategory(151).id).toBe('unhealthy');
      expect(getCategory(175).id).toBe('unhealthy');
      expect(getCategory(200).id).toBe('unhealthy');
    });

    it('handles Very Unhealthy boundary (201 - 300)', () => {
      expect(getCategory(201).id).toBe('very_unhealthy');
      expect(getCategory(250).id).toBe('very_unhealthy');
      expect(getCategory(300).id).toBe('very_unhealthy');
    });

    it('handles Hazardous boundary (301+)', () => {
      expect(getCategory(301).id).toBe('hazardous');
      expect(getCategory(450).id).toBe('hazardous');
      expect(getCategory(999).id).toBe('hazardous');
    });

    it('handles edge cases gracefully (negative, NaN, invalid types)', () => {
      expect(getCategory(-10).id).toBe('good');
      expect(getCategory(NaN).id).toBe('good');
      // @ts-expect-error test invalid type
      expect(getCategory('invalid').id).toBe('good');
      // @ts-expect-error test null
      expect(getCategory(null).id).toBe('good');
    });
  });

  describe('getDominantPollutant', () => {
    it('identifies dominant pollutant by highest threshold ratio', () => {
      const readings = {
        pm2_5: 70, // 70 / 35 = 2.0
        pm10: 150, // 150 / 150 = 1.0
        no2: 50 // 50 / 100 = 0.5
      };
      const result = getDominantPollutant(readings);
      expect(result).not.toBeNull();
      expect(result?.pollutant).toBe('pm2_5');
      expect(result?.ratio).toBe(2.0);
      expect(result?.value).toBe(70);
    });

    it('normalizes alternate keys like pm25 or hyphenated keys', () => {
      const readings = {
        pm25: 105, // 105 / 35 = 3.0
        o3: 35
      };
      const result = getDominantPollutant(readings);
      expect(result?.pollutant).toBe('pm2_5');
      expect(result?.ratio).toBe(3.0);
    });

    it('handles o3 or no2 as dominant when elevated', () => {
      const readings = {
        pm2_5: 10,
        o3: 140, // 140 / 70 = 2.0
        no2: 25,
        so2: 15,
        co: 2
      };
      const result = getDominantPollutant(readings);
      expect(result?.pollutant).toBe('o3');
    });

    it('returns null on empty, invalid, or missing inputs', () => {
      expect(getDominantPollutant({})).toBeNull();
      // @ts-expect-error null check
      expect(getDominantPollutant(null)).toBeNull();
      // @ts-expect-error undefined check
      expect(getDominantPollutant(undefined)).toBeNull();
      expect(getDominantPollutant({ unknown_gas: 100 })).toBeNull();
      expect(getDominantPollutant({ pm2_5: -5, pm10: NaN })).toBeNull();
    });
  });

  describe('Legacy and UI compatibility helpers', () => {
    it('getAqiCategory maps correctly', () => {
      expect(getAqiCategory(25)).toBe('good');
      expect(getAqiCategory(75)).toBe('moderate');
      expect(getAqiCategory(120)).toBe('unhealthySensitive');
      expect(getAqiCategory(180)).toBe('unhealthy');
      expect(getAqiCategory(250)).toBe('veryUnhealthy');
      expect(getAqiCategory(400)).toBe('hazardous');
    });

    it('getAqiColor returns valid hex codes', () => {
      expect(getAqiColor(30)).toBe('#007a3d');
      expect(getAqiColor(75)).toBe('#946800');
      expect(getAqiColor(120)).toBe('#c44000');
      expect(getAqiColor(175)).toBe('#b3001e');
      expect(getAqiColor(250)).toBe('#6b007b');
      expect(getAqiColor(350)).toBe('#590024');
    });

    it('shouldLimitOutdoorActivity flags values above Good', () => {
      expect(shouldLimitOutdoorActivity(40)).toBe(false);
      expect(shouldLimitOutdoorActivity(50)).toBe(false);
      expect(shouldLimitOutdoorActivity(51)).toBe(true);
      expect(shouldLimitOutdoorActivity(150)).toBe(true);
    });
  });
});
