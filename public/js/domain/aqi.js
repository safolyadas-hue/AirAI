/**
 * Air Quality Index (AQI) Calculation and Categorization Domain Logic
 * Pure functions: zero DOM or network access.
 */
import { AQI_BREAKPOINTS } from '../config.js';
import {
  POLLUTANT_REFERENCE_THRESHOLDS,
  CONCENTRATION_TO_EPA_UNIT_FACTORS,
  EPA_POLLUTANT_BREAKPOINTS,
  AQI_CATEGORIES
} from './aqiBreakpoints.js';

export {
  POLLUTANT_REFERENCE_THRESHOLDS,
  CONCENTRATION_TO_EPA_UNIT_FACTORS,
  EPA_POLLUTANT_BREAKPOINTS,
  AQI_CATEGORIES
};

/**
 * Returns the US AQI category object corresponding to an AQI value.
 * @param {number} aqi - Numeric AQI value (0 - 500+).
 * @returns {typeof AQI_CATEGORIES[number]} Category configuration object.
 */
export function getCategory(aqi) {
  if (typeof aqi !== 'number' || Number.isNaN(aqi) || aqi <= 0) {
    return AQI_CATEGORIES[0];
  }
  for (const category of AQI_CATEGORIES) {
    if (aqi >= category.min && aqi <= category.max) {
      return category;
    }
  }
  return AQI_CATEGORIES[AQI_CATEGORIES.length - 1];
}

/**
 * Normalizes reading keys to standard pollutant identifiers.
 * @param {string} key
 * @returns {keyof typeof CONCENTRATION_TO_EPA_UNIT_FACTORS | null}
 */
export function normalizePollutantKey(key) {
  const clean = key.toLowerCase().replace(/[-.]/g, '_');
  if (clean === 'pm25' || clean === 'pm2_5') return 'pm2_5';
  if (clean in CONCENTRATION_TO_EPA_UNIT_FACTORS) {
    return /** @type {keyof typeof CONCENTRATION_TO_EPA_UNIT_FACTORS} */ (clean);
  }
  return null;
}

/**
 * Calculates the US EPA AQI sub-index for a single pollutant concentration in µg/m³.
 * @param {string} pollutant
 * @param {number} concentrationUgm3
 * @returns {number} EPA AQI sub-index (0 to 500+)
 */
export function calculateSubIndex(pollutant, concentrationUgm3) {
  if (
    typeof concentrationUgm3 !== 'number' ||
    Number.isNaN(concentrationUgm3) ||
    concentrationUgm3 <= 0
  ) {
    return 0;
  }

  const factor = CONCENTRATION_TO_EPA_UNIT_FACTORS[pollutant];
  const brackets = EPA_POLLUTANT_BREAKPOINTS[pollutant];
  if (!factor || !brackets) return 0;

  const conc = concentrationUgm3 / factor;
  for (const [cLo, cHi, iLo, iHi] of brackets) {
    if (conc >= cLo && conc <= cHi) {
      return Math.round(((iHi - iLo) / (cHi - cLo)) * (conc - cLo) + iLo);
    }
  }

  const [cLo, cHi, iLo, iHi] = brackets[brackets.length - 1];
  if (conc > cHi) {
    return Math.round(((iHi - iLo) / (cHi - cLo)) * (conc - cLo) + iLo);
  }
  return 0;
}

/**
 * Identifies the dominant pollutant from ambient concentration readings in µg/m³.
 * @param {Record<string, number | null | undefined>} readings
 * @returns {{ pollutant: string, value: number, subIndex: number, aqi: number, ratio: number } | null}
 */
export function getDominantPollutant(readings) {
  if (!readings || typeof readings !== 'object') return null;

  let dominant = null;
  let maxSubIndex = -1;
  let validCount = 0;

  for (const [rawKey, rawValue] of Object.entries(readings)) {
    const key = normalizePollutantKey(rawKey);
    if (!key) continue;
    if (
      rawValue === null ||
      rawValue === undefined ||
      typeof rawValue !== 'number' ||
      Number.isNaN(rawValue) ||
      rawValue < 0
    ) {
      continue;
    }

    validCount += 1;
    const subIndex = calculateSubIndex(key, rawValue);
    if (subIndex > maxSubIndex) {
      maxSubIndex = subIndex;
      dominant = {
        pollutant: key,
        value: rawValue,
        subIndex,
        aqi: subIndex,
        ratio: Math.round((subIndex / 100) * 100) / 100
      };
    }
  }

  if (validCount === 0) return null;
  return dominant || { pollutant: 'pm2_5', value: 0, subIndex: 0, aqi: 0, ratio: 0 };
}

/**
 * Legacy/UI compatibility helper: returns category key name.
 * @param {number} aqi
 * @returns {'good' | 'moderate' | 'unhealthySensitive' | 'unhealthy' | 'veryUnhealthy' | 'hazardous'}
 */
export function getAqiCategory(aqi) {
  const cat = getCategory(aqi);
  switch (cat.id) {
    case 'good':
      return AQI_BREAKPOINTS.GOOD.label;
    case 'moderate':
      return AQI_BREAKPOINTS.MODERATE.label;
    case 'unhealthy_sensitive':
      return AQI_BREAKPOINTS.UNHEALTHY_SENSITIVE.label;
    case 'unhealthy':
      return AQI_BREAKPOINTS.UNHEALTHY.label;
    case 'very_unhealthy':
      return AQI_BREAKPOINTS.VERY_UNHEALTHY.label;
    case 'hazardous':
    default:
      return AQI_BREAKPOINTS.HAZARDOUS.label;
  }
}

/**
 * Legacy/UI compatibility helper: returns hex color string.
 * @param {number} aqi
 * @returns {string}
 */
export function getAqiColor(aqi) {
  return getCategory(aqi).colorHex;
}

/**
 * Determines whether vulnerable individuals should restrict outdoor exposure.
 * @param {number} aqi
 * @returns {boolean}
 */
export function shouldLimitOutdoorActivity(aqi) {
  return typeof aqi === 'number' && aqi > AQI_CATEGORIES[0].max;
}
