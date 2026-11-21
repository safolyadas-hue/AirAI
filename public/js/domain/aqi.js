/**
 * Air Quality Index (AQI) Calculation and Categorization Domain Logic
 * Pure functions: zero DOM or network access.
 */
import { AQI_BREAKPOINTS } from '../config.js';

/**
 * Returns the AQI category key corresponding to an index value.
 * @param {number} aqi - Numeric AQI value (0 - 500+).
 * @returns {string} Category key ('good' | 'moderate' | 'unhealthySensitive' | 'unhealthy' | 'veryUnhealthy' | 'hazardous')
 */
export function getAqiCategory(aqi) {
  if (typeof aqi !== 'number' || Number.isNaN(aqi) || aqi < 0) {
    return 'good';
  }

  if (aqi <= AQI_BREAKPOINTS.GOOD.max) {
    return AQI_BREAKPOINTS.GOOD.label;
  }
  if (aqi <= AQI_BREAKPOINTS.MODERATE.max) {
    return AQI_BREAKPOINTS.MODERATE.label;
  }
  if (aqi <= AQI_BREAKPOINTS.UNHEALTHY_SENSITIVE.max) {
    return AQI_BREAKPOINTS.UNHEALTHY_SENSITIVE.label;
  }
  if (aqi <= AQI_BREAKPOINTS.UNHEALTHY.max) {
    return AQI_BREAKPOINTS.UNHEALTHY.label;
  }
  if (aqi <= AQI_BREAKPOINTS.VERY_UNHEALTHY.max) {
    return AQI_BREAKPOINTS.VERY_UNHEALTHY.label;
  }
  return AQI_BREAKPOINTS.HAZARDOUS.label;
}

/**
 * Returns the associated theme color code for a given AQI value.
 * @param {number} aqi - Numeric AQI value.
 * @returns {string} Hex color string.
 */
export function getAqiColor(aqi) {
  const category = getAqiCategory(aqi);
  for (const key of Object.keys(AQI_BREAKPOINTS)) {
    if (AQI_BREAKPOINTS[key].label === category) {
      return AQI_BREAKPOINTS[key].color;
    }
  }
  return AQI_BREAKPOINTS.GOOD.color;
}

/**
 * Determines whether vulnerable individuals should restrict outdoor exposure.
 * @param {number} aqi - Numeric AQI value.
 * @returns {boolean} True if outdoor activity should be limited.
 */
export function shouldLimitOutdoorActivity(aqi) {
  return typeof aqi === 'number' && aqi > AQI_BREAKPOINTS.GOOD.max;
}
