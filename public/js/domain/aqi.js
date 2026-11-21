/**
 * Air Quality Index (AQI) Calculation and Categorization Domain Logic
 * Pure functions: zero DOM or network access.
 * Source: US EPA Air Quality Index (AQI) Standards & NAAQS 40 CFR Part 58
 */
import { AQI_BREAKPOINTS } from '../config.js';

/**
 * Standard EPA Reference Concentrations at AQI 100 Threshold
 * Used to normalize pollutant sub-indices and determine the dominant driver.
 * Source: US EPA NAAQS Primary Standards
 */
export const POLLUTANT_REFERENCE_THRESHOLDS = Object.freeze({
  pm2_5: 35.0, // µg/m³ 24-hr standard
  pm10: 150.0, // µg/m³ 24-hr standard
  no2: 100.0, // ppb 1-hr standard
  o3: 70.0, // ppb 8-hr standard
  so2: 75.0, // ppb 1-hr standard
  co: 9.0 // ppm 8-hr standard
});

/**
 * US AQI Categories configuration array
 * Source: US EPA AQI Technical Assistance Document
 */
export const AQI_CATEGORIES = Object.freeze([
  Object.freeze({
    id: 'good',
    label: 'Good',
    min: 0,
    max: 50,
    colorToken: '--aqi-good',
    colorHex: '#007a3d',
    shortMeaning: 'Air quality is satisfactory and poses little or no risk.',
    generalHealthMessage: 'Air quality is acceptable; enjoy outdoor activities.'
  }),
  Object.freeze({
    id: 'moderate',
    label: 'Moderate',
    min: 51,
    max: 100,
    colorToken: '--aqi-moderate',
    colorHex: '#946800',
    shortMeaning: 'Air quality is acceptable; sensitive individuals may experience minor symptoms.',
    generalHealthMessage:
      'Unusually sensitive individuals should consider reducing prolonged outdoor exertion.'
  }),
  Object.freeze({
    id: 'unhealthy_sensitive',
    label: 'Unhealthy for Sensitive Groups',
    min: 101,
    max: 150,
    colorToken: '--aqi-unhealthy-sensitive',
    colorHex: '#c44000',
    shortMeaning: 'Members of sensitive groups may experience health effects.',
    generalHealthMessage:
      'Children, elderly, and people with respiratory or heart diseases should reduce prolonged outdoor exertion.'
  }),
  Object.freeze({
    id: 'unhealthy',
    label: 'Unhealthy',
    min: 151,
    max: 200,
    colorToken: '--aqi-unhealthy',
    colorHex: '#b3001e',
    shortMeaning: 'Some members of the general public may experience health effects.',
    generalHealthMessage:
      'Everyone should reduce prolonged or heavy outdoor exertion. Sensitive groups should avoid outdoor activity.'
  }),
  Object.freeze({
    id: 'very_unhealthy',
    label: 'Very Unhealthy',
    min: 201,
    max: 300,
    colorToken: '--aqi-very-unhealthy',
    colorHex: '#6b007b',
    shortMeaning: 'Health alert: the risk of health effects is increased for everyone.',
    generalHealthMessage:
      'Children, older adults, and individuals with respiratory issues should remain indoors. Everyone should avoid outdoor exertion.'
  }),
  Object.freeze({
    id: 'hazardous',
    label: 'Hazardous',
    min: 301,
    max: Infinity,
    colorToken: '--aqi-hazardous',
    colorHex: '#590024',
    shortMeaning: 'Health warning of emergency conditions; everyone is affected.',
    generalHealthMessage:
      'Serious health alert: everyone should remain indoors with sealed filtration and avoid any outdoor exposure.'
  })
]);

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
 * @returns {keyof typeof POLLUTANT_REFERENCE_THRESHOLDS | null}
 */
function normalizePollutantKey(key) {
  const clean = key.toLowerCase().replace(/[-.]/g, '_');
  if (clean === 'pm25' || clean === 'pm2_5') return 'pm2_5';
  if (clean in POLLUTANT_REFERENCE_THRESHOLDS) {
    return /** @type {keyof typeof POLLUTANT_REFERENCE_THRESHOLDS} */ (clean);
  }
  return null;
}

/**
 * Identifies the dominant pollutant from ambient concentration readings.
 * @param {Record<string, number | null | undefined>} readings - Measured concentrations.
 * @returns {{ pollutant: string, value: number, ratio: number } | null}
 */
export function getDominantPollutant(readings) {
  if (!readings || typeof readings !== 'object') {
    return null;
  }

  let dominant = null;
  let maxRatio = -1;

  for (const [rawKey, rawValue] of Object.entries(readings)) {
    const key = normalizePollutantKey(rawKey);
    if (!key || typeof rawValue !== 'number' || Number.isNaN(rawValue) || rawValue < 0) {
      continue;
    }

    const threshold = POLLUTANT_REFERENCE_THRESHOLDS[key];
    const ratio = rawValue / threshold;

    if (ratio > maxRatio) {
      maxRatio = ratio;
      dominant = {
        pollutant: key,
        value: rawValue,
        ratio: Math.round(ratio * 100) / 100
      };
    }
  }

  return dominant;
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
 * @returns {string} Hex color string.
 */
export function getAqiColor(aqi) {
  return getCategory(aqi).colorHex;
}

/**
 * Determines whether vulnerable individuals should restrict outdoor exposure.
 * @param {number} aqi - Numeric AQI value.
 * @returns {boolean} True if outdoor activity should be limited.
 */
export function shouldLimitOutdoorActivity(aqi) {
  return typeof aqi === 'number' && aqi > AQI_CATEGORIES[0].max;
}
