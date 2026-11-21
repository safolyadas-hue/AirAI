/**
 * Impact Calculation Engine
 * Pure functions: computes modeled CO2 emission avoidance and indoor PM2.5 reduction estimates.
 * All outputs are labeled as estimates with underlying scientific assumptions.
 */
import { ACTION_IMPACT_FACTORS, getEmissionFactor } from './impactFactors.js';
import { IMPACT_CONSTANTS } from '../config.js';

/**
 * @typedef {Object} ActionImpactEstimate
 * @property {string} actionId
 * @property {{ min: number, max: number }} pm25ReductionPercentRange
 * @property {number} co2AvoidedKgWeekly
 * @property {'low' | 'medium' | 'high'} confidence
 * @property {string} assumption
 * @property {true} isEstimate
 */

/**
 * @typedef {Object} ImpactSummary
 * @property {number} totalCo2AvoidedKgWeekly
 * @property {{ min: number, max: number }} estimatedIndoorPm25ReductionPercent
 * @property {number} actionCount
 * @property {string} disclaimer
 * @property {true} isEstimate
 */

/**
 * Estimates environmental and air quality impact for a single recommended action.
 * @param {string} actionId - Identifier matching an action or impact key.
 * @param {import('./profile.js').UserProfile} [profile] - Contextual household profile.
 * @returns {ActionImpactEstimate}
 */
export function estimateImpact(actionId, profile) {
  const factor = ACTION_IMPACT_FACTORS[
    /** @type {keyof typeof ACTION_IMPACT_FACTORS} */ (actionId)
  ] || {
    pm25ReductionPercentRange: { min: 15, max: 30 },
    co2AvoidedKgWeekly: 0,
    confidence: 'medium',
    assumption: 'Estimated based on standard household environmental exposure modeling.'
  };

  let co2Weekly = factor.co2AvoidedKgWeekly;

  // Personalize commute emissions if commute distance is provided
  if (actionId === 'clean-commute-swap' && profile?.commute?.distanceKm) {
    const dist = profile.commute.distanceKm;
    // 2 trips/day * 5 work days/week * saving factor
    const weeklyKm = dist * 2 * 5;
    const factorPerKm = getEmissionFactor('car') - getEmissionFactor('public_transit');
    co2Weekly = Math.round(weeklyKm * factorPerKm * 10) / 10;
  }

  return {
    actionId,
    pm25ReductionPercentRange: factor.pm25ReductionPercentRange,
    co2AvoidedKgWeekly: co2Weekly,
    confidence: factor.confidence,
    assumption: factor.assumption,
    isEstimate: true
  };
}

/**
 * Summarizes the aggregate modeled impact of a list of actions.
 * @param {Array<{ id?: string, impactKey?: string }>} actions
 * @param {import('./profile.js').UserProfile} [profile]
 * @returns {ImpactSummary}
 */
export function summarizeImpact(actions = [], profile) {
  if (!Array.isArray(actions) || actions.length === 0) {
    return {
      totalCo2AvoidedKgWeekly: 0,
      estimatedIndoorPm25ReductionPercent: { min: 0, max: 0 },
      actionCount: 0,
      disclaimer: 'Estimates are modeled based on published EPA, WHO, and NIOSH benchmarks.',
      isEstimate: true
    };
  }

  let totalCo2 = 0;
  let maxMinPm25 = 0;
  let maxMaxPm25 = 0;

  for (const item of actions) {
    const key = item.impactKey || item.id;
    if (!key) continue;
    const est = estimateImpact(key, profile);
    totalCo2 += est.co2AvoidedKgWeekly;
    if (est.pm25ReductionPercentRange.min > maxMinPm25) {
      maxMinPm25 = est.pm25ReductionPercentRange.min;
    }
    if (est.pm25ReductionPercentRange.max > maxMaxPm25) {
      maxMaxPm25 = est.pm25ReductionPercentRange.max;
    }
  }

  return {
    totalCo2AvoidedKgWeekly: Math.round(totalCo2 * 100) / 100,
    estimatedIndoorPm25ReductionPercent: { min: maxMinPm25, max: maxMaxPm25 },
    actionCount: actions.length,
    disclaimer:
      'All figures are modeled estimates based on standard exposure assumptions and peer-reviewed filtration studies. Individual home leakage and personal fit will cause variations.',
    isEstimate: true
  };
}

/**
 * Legacy/UI compatibility helper: calculates saved CO2 for a commute.
 * @param {number} distanceKm
 * @param {'walk' | 'bike' | 'transit' | 'cycle' | 'public_transit'} replacementMode
 * @returns {number}
 */
export function calculateEmissionsSaved(distanceKm, replacementMode) {
  if (typeof distanceKm !== 'number' || distanceKm <= 0) return 0;
  let savedPerKm = IMPACT_CONSTANTS.CAR_EMISSION_FACTOR_PER_KM;
  if (replacementMode === 'transit' || replacementMode === 'public_transit') {
    savedPerKm = IMPACT_CONSTANTS.TRANSIT_SAVINGS_PER_KM;
  }
  return Math.round(distanceKm * savedPerKm * 100) / 100;
}

/**
 * Legacy/UI compatibility helper: computes estimated indoor PM2.5.
 * @param {number} outdoorPm25
 * @param {boolean} hasFilter
 * @returns {number}
 */
export function estimateIndoorPm25(outdoorPm25, hasFilter) {
  if (typeof outdoorPm25 !== 'number' || outdoorPm25 <= 0) return 0;
  if (!hasFilter) {
    return Math.round(outdoorPm25 * 0.7 * 10) / 10;
  }
  const reduction = outdoorPm25 * IMPACT_CONSTANTS.HEPA_REDUCTION_PERCENTAGE;
  return Math.max(0, Math.round((outdoorPm25 - reduction) * 10) / 10);
}
