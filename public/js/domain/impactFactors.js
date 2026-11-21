/**
 * Environmental Impact Factors Reference Data
 * Pure functions & constants for emission and lifestyle calculators.
 */
import { IMPACT_CONSTANTS } from '../config.js';

/**
 * Returns the coefficient factor for a commute mode replacement.
 * @param {'car' | 'transit' | 'bike' | 'walk'} mode
 * @returns {number} CO2 kg / km factor.
 */
export function getEmissionFactor(mode) {
  switch (mode) {
    case 'car':
      return IMPACT_CONSTANTS.CAR_EMISSION_FACTOR_PER_KM;
    case 'transit':
      return IMPACT_CONSTANTS.TRANSIT_SAVINGS_PER_KM;
    case 'bike':
    case 'walk':
    default:
      return 0;
  }
}

/**
 * Describes the emission savings qualitative tier.
 * @param {number} kgSaved - Total kg CO2 avoided.
 * @returns {'bronze' | 'silver' | 'gold'}
 */
export function getImpactBadgeTier(kgSaved) {
  if (kgSaved >= 50) return 'gold';
  if (kgSaved >= 15) return 'silver';
  return 'bronze';
}
