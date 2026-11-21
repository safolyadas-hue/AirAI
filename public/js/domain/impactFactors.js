/**
 * Environmental Impact Factors Reference Data
 * Pure data and helper functions.
 * All numbers are scientific estimates with explicit assumptions.
 */
import { IMPACT_CONSTANTS } from '../config.js';

/**
 * Documented table of per-action impact estimates.
 * Contains estimated PM2.5 exposure reductions, CO2 avoidance, confidence tiers, and scientific assumptions.
 */
export const ACTION_IMPACT_FACTORS = Object.freeze({
  'shift-outdoor-exercise': Object.freeze({
    pm25ReductionPercentRange: Object.freeze({ min: 40, max: 70 }),
    co2AvoidedKgWeekly: 0,
    confidence: 'high',
    assumption:
      'Shifting intense aerobic exertion to cleaner morning/afternoon hours or indoors cuts inhaled PM2.5 dose by 40-70% (EPA Exposure Factors Handbook).'
  }),
  'n95-respirator-protection': Object.freeze({
    pm25ReductionPercentRange: Object.freeze({ min: 70, max: 85 }),
    co2AvoidedKgWeekly: 0,
    confidence: 'high',
    assumption:
      'Certified N95/FFP2/KF94 filter media trap >=95% of fine particles; real-world facial seal leakage in community settings provides 70-85% effective inhalation protection (NIOSH/CDC).'
  }),
  'smart-ventilation-air-cleaning': Object.freeze({
    pm25ReductionPercentRange: Object.freeze({ min: 65, max: 85 }),
    co2AvoidedKgWeekly: 0,
    confidence: 'high',
    assumption:
      'Operating a sized True HEPA purifier or DIY Corsi-Rosenthal box fan in a sealed room reduces indoor PM2.5 by 65-85% within 60 minutes (UC Davis & EPA Indoor Air Testing).'
  }),
  'cooking-emission-control': Object.freeze({
    pm25ReductionPercentRange: Object.freeze({ min: 50, max: 80 }),
    co2AvoidedKgWeekly: 4.5,
    confidence: 'medium',
    assumption:
      'Exhaust ventilation or switching from LPG/biomass to induction cuts peak indoor PM2.5 and NO2 by 50-80% and avoids ~4.5 kg CO2 weekly from domestic gas/biomass burning.'
  }),
  'clean-commute-swap': Object.freeze({
    pm25ReductionPercentRange: Object.freeze({ min: 20, max: 40 }),
    co2AvoidedKgWeekly: 17.1,
    confidence: 'high',
    assumption:
      'Replacing a 10 km single-occupancy passenger car commute with public electric transit prevents ~17.1 kg CO2/week and avoids sitting directly in street-level exhaust plumes.'
  }),
  'clean-heating-alternatives': Object.freeze({
    pm25ReductionPercentRange: Object.freeze({ min: 75, max: 90 }),
    co2AvoidedKgWeekly: 25.0,
    confidence: 'high',
    assumption:
      'Ceasing solid fuel (wood or coal) combustion removes the primary domestic source of toxic indoor black carbon and avoids ~25 kg CO2 equivalent weekly.'
  }),
  'child-school-guidance': Object.freeze({
    pm25ReductionPercentRange: Object.freeze({ min: 40, max: 60 }),
    co2AvoidedKgWeekly: 0,
    confidence: 'medium',
    assumption:
      'Canceling outdoor athletic activities during heavy smog protects developing pediatric alveoli, reducing inhaled particulate burden by 40-60%.'
  }),
  'vulnerable-household-care': Object.freeze({
    pm25ReductionPercentRange: Object.freeze({ min: 50, max: 70 }),
    co2AvoidedKgWeekly: 0,
    confidence: 'high',
    assumption:
      'Proactive indoor shelter and medication readiness reduces asthma flare-ups and cardiovascular emergency visits by 50-70% (American Thoracic Society).'
  }),
  'eliminate-indoor-combustion': Object.freeze({
    pm25ReductionPercentRange: Object.freeze({ min: 20, max: 45 }),
    co2AvoidedKgWeekly: 0,
    confidence: 'medium',
    assumption:
      'Avoiding incense burning, scented candles, and aerosol sprays removes indoor emitters of ultrafine particles (<0.1 µm) and carcinogenic VOCs.'
  }),
  'wet-mopping-hydration': Object.freeze({
    pm25ReductionPercentRange: Object.freeze({ min: 25, max: 40 }),
    co2AvoidedKgWeekly: 0,
    confidence: 'medium',
    assumption:
      'Damp microfiber mopping captures settled dust on floor surfaces without the mechanical particle resuspension caused by dry sweeping (EPA Household Exposure).'
  })
});

/**
 * Returns the coefficient factor for a commute mode replacement.
 * @param {'car' | 'transit' | 'bike' | 'walk' | 'public_transit' | 'cycle' | 'two_wheeler' | 'work_from_home'} mode
 * @returns {number} CO2 kg / km factor.
 */
export function getEmissionFactor(mode) {
  switch (mode) {
    case 'car':
      return IMPACT_CONSTANTS.CAR_EMISSION_FACTOR_PER_KM;
    case 'transit':
    case 'public_transit':
      return IMPACT_CONSTANTS.TRANSIT_SAVINGS_PER_KM;
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
