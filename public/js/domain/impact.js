/**
 * Impact Calculation Engine
 * Pure functions: computes CO2 emission avoidance and indoor air quality gains.
 */
import { IMPACT_CONSTANTS } from '../config.js';

/**
 * Calculates estimated CO2 emissions avoided by choosing sustainable transit.
 * @param {number} distanceKm - Distance in kilometers.
 * @param {'walk' | 'bike' | 'transit'} replacementMode - Mode of green transport chosen.
 * @returns {number} Saved CO2 in kilograms (rounded to 2 decimal places).
 */
export function calculateEmissionsSaved(distanceKm, replacementMode) {
  if (typeof distanceKm !== 'number' || distanceKm <= 0) {
    return 0;
  }

  let savedPerKm = IMPACT_CONSTANTS.CAR_EMISSION_FACTOR_PER_KM;
  if (replacementMode === 'transit') {
    savedPerKm = IMPACT_CONSTANTS.TRANSIT_SAVINGS_PER_KM;
  }

  const totalSaved = distanceKm * savedPerKm;
  return Math.round(totalSaved * 100) / 100;
}

/**
 * Computes projected indoor PM2.5 levels when protective indoor measures are applied.
 * @param {number} outdoorPm25 - Outdoor PM2.5 concentration in ug/m3.
 * @param {boolean} hasFilter - Whether an active filter or sealed barrier is operating.
 * @returns {number} Estimated indoor PM2.5 in ug/m3.
 */
export function estimateIndoorPm25(outdoorPm25, hasFilter) {
  if (typeof outdoorPm25 !== 'number' || outdoorPm25 <= 0) {
    return 0;
  }

  if (!hasFilter) {
    // Unsealed indoor air typically equilibrates to ~70% of outdoor particulate levels
    return Math.round(outdoorPm25 * 0.7 * 10) / 10;
  }

  const reduction = outdoorPm25 * IMPACT_CONSTANTS.HEPA_REDUCTION_PERCENTAGE;
  return Math.max(0, Math.round((outdoorPm25 - reduction) * 10) / 10);
}
