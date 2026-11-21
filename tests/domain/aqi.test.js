import { describe, it, expect } from 'vitest';
import {
  AQI_CATEGORIES,
  getCategory,
  getDominantPollutant,
  calculateSubIndex,
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

  describe('getDominantPollutant and EPA AQI Sub-Index Calculation', () => {
    it('correctly calculates sub-indices for individual pollutants', () => {
      // PM2.5: 12 µg/m³ -> AQI 50, 35.4 µg/m³ -> AQI 100
      expect(calculateSubIndex('pm2_5', 12)).toBe(50);
      expect(calculateSubIndex('pm2_5', 35.4)).toBe(100);

      // CO: 1145.6 µg/m³ = 1 ppm -> 1.0 ppm in [0.0, 4.4] -> round((50/4.4)*1.0) = 11
      expect(calculateSubIndex('co', 1145.6)).toBe(11);
    });

    it('identifies pm2_5 as dominant for Delhi winter smog (high PM2.5 & PM10, high/moderate CO in µg/m³)', () => {
      const delhiWinterSmog = {
        pm2_5: 185.0, // Sub-index ~235
        pm10: 260.0, // Sub-index ~153
        no2: 55.0, // Sub-index ~28 (55 / 1.88 = 29 ppb)
        o3: 20.0, // Sub-index ~10
        so2: 15.0, // Sub-index ~8
        co: 1800.0 // 1800 µg/m³ = 1.57 ppm -> Sub-index ~18 (NOT dominant!)
      };
      const result = getDominantPollutant(delhiWinterSmog);
      expect(result).not.toBeNull();
      expect(result?.pollutant).toBe('pm2_5');
      expect(result?.subIndex).toBeGreaterThan(200);
      expect(result?.value).toBe(185.0);
    });

    it('identifies o3 as dominant for summer ozone-dominated episodes', () => {
      const summerOzone = {
        pm2_5: 15.0, // Sub-index ~57
        pm10: 30.0, // Sub-index ~28
        o3: 175.0, // 175 / 1.96 = 89.3 ppb -> Sub-index ~159
        no2: 30.0,
        so2: 10.0,
        co: 600.0 // 600 / 1145.6 = 0.52 ppm -> Sub-index ~6
      };
      const result = getDominantPollutant(summerOzone);
      expect(result).not.toBeNull();
      expect(result?.pollutant).toBe('o3');
      expect(result?.subIndex).toBeGreaterThan(150);
    });

    it('handles missing or omitted pollutant values gracefully', () => {
      const missingReadings = {
        pm2_5: 65.0,
        pm10: null,
        co: undefined,
        // @ts-expect-error test NaN
        no2: NaN
      };
      const result = getDominantPollutant(missingReadings);
      expect(result).not.toBeNull();
      expect(result?.pollutant).toBe('pm2_5');
      expect(result?.subIndex).toBeGreaterThan(150);
    });

    it('handles the all-zero readings case without error', () => {
      const allZero = {
        pm2_5: 0,
        pm10: 0,
        no2: 0,
        o3: 0,
        so2: 0,
        co: 0
      };
      const result = getDominantPollutant(allZero);
      expect(result).not.toBeNull();
      expect(result?.pollutant).toBe('pm2_5');
      expect(result?.subIndex).toBe(0);
      expect(result?.value).toBe(0);
    });

    it('normalizes alternate keys like pm25 or hyphenated keys', () => {
      const readings = {
        pm25: 110,
        o3: 35
      };
      const result = getDominantPollutant(readings);
      expect(result?.pollutant).toBe('pm2_5');
      expect(result?.subIndex).toBeGreaterThan(170);
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
