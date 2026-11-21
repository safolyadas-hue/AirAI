/**
 * Air Quality Index (AQI) Calculation and Categorization Domain Logic
 * Pure functions: zero DOM or network access.
 * Source: US EPA Air Quality Index (AQI) Standards & NAAQS 40 CFR Part 58 Appendix G
 */
import { AQI_BREAKPOINTS } from '../config.js';

/**
 * Standard EPA Reference Concentrations at AQI 100 Threshold
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
 * Conversion factors from Open-Meteo µg/m³ concentrations to standard EPA AQI reporting units:
 * Standard conditions: 25 °C (298.15 K) and 101.325 kPa (1 atm), molar volume Vm = 24.45 L/mol.
 * Formula: conc_ppb = (conc_µg/m³ * 24.45) / MolarMass
 *
 * - PM2.5: native µg/m³ (factor = 1.0)
 * - PM10: native µg/m³ (factor = 1.0)
 * - NO2: Molar mass 46.01 g/mol => 1 ppb = 1.88 µg/m³ (divide µg/m³ by 1.88)
 * - O3: Molar mass 48.00 g/mol => 1 ppb = 1.96 µg/m³ (divide µg/m³ by 1.96)
 * - SO2: Molar mass 64.07 g/mol => 1 ppb = 2.62 µg/m³ (divide µg/m³ by 2.62)
 * - CO: Molar mass 28.01 g/mol => 1 ppm = 1145.6 µg/m³ (divide µg/m³ by 1145.6)
 */
export const CONCENTRATION_TO_EPA_UNIT_FACTORS = Object.freeze({
  pm2_5: 1.0,
  pm10: 1.0,
  no2: 1.88,
  o3: 1.96,
  so2: 2.62,
  co: 1145.6
});

/**
 * EPA Official Breakpoints Table (40 CFR Part 58 Appendix G)
 * Format per bracket: [C_lo, C_hi, I_lo, I_hi]
 * Reporting units: PM2.5 (µg/m³), PM10 (µg/m³), NO2 (ppb), O3 (ppb), SO2 (ppb), CO (ppm)
 */
export const EPA_POLLUTANT_BREAKPOINTS = Object.freeze({
  pm2_5: Object.freeze([
    [0.0, 12.0, 0, 50],
    [12.1, 35.4, 51, 100],
    [35.5, 55.4, 101, 150],
    [55.5, 150.4, 151, 200],
    [150.5, 250.4, 201, 300],
    [250.5, 350.4, 301, 400],
    [350.5, 500.4, 401, 500]
  ]),
  pm10: Object.freeze([
    [0, 54, 0, 50],
    [55, 154, 51, 100],
    [155, 254, 101, 150],
    [255, 354, 151, 200],
    [355, 424, 201, 300],
    [425, 504, 301, 400],
    [505, 604, 401, 500]
  ]),
  no2: Object.freeze([
    [0, 53, 0, 50],
    [54, 100, 51, 100],
    [101, 360, 101, 150],
    [361, 649, 151, 200],
    [650, 1249, 201, 300],
    [1250, 1649, 301, 400],
    [1650, 2049, 401, 500]
  ]),
  o3: Object.freeze([
    [0, 54, 0, 50],
    [55, 70, 51, 100],
    [71, 85, 101, 150],
    [86, 105, 151, 200],
    [106, 200, 201, 300],
    [201, 404, 301, 400],
    [405, 504, 401, 500]
  ]),
  so2: Object.freeze([
    [0, 35, 0, 50],
    [36, 75, 51, 100],
    [76, 185, 101, 150],
    [186, 304, 151, 200],
    [305, 604, 201, 300],
    [605, 804, 301, 400],
    [805, 1004, 401, 500]
  ]),
  co: Object.freeze([
    [0.0, 4.4, 0, 50],
    [4.5, 9.4, 51, 100],
    [9.5, 12.4, 101, 150],
    [12.5, 15.4, 151, 200],
    [15.5, 30.4, 201, 300],
    [30.5, 40.4, 301, 400],
    [40.5, 50.4, 401, 500]
  ])
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
 * Converts concentration to the official reporting unit and interpolates within EPA breakpoints.
 * @param {string} pollutant - E.g. 'pm2_5', 'pm10', 'no2', 'o3', 'so2', 'co'
 * @param {number} concentrationUgm3 - Concentration measured in µg/m³
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
  if (!factor || !brackets) {
    return 0;
  }

  // Convert from µg/m³ to EPA reporting units (ppb, ppm, or µg/m³)
  const conc = concentrationUgm3 / factor;

  for (const [cLo, cHi, iLo, iHi] of brackets) {
    if (conc >= cLo && conc <= cHi) {
      const aqi = ((iHi - iLo) / (cHi - cLo)) * (conc - cLo) + iLo;
      return Math.round(aqi);
    }
  }

  // Above top bracket: linear extrapolation
  const [cLo, cHi, iLo, iHi] = brackets[brackets.length - 1];
  if (conc > cHi) {
    const aqi = ((iHi - iLo) / (cHi - cLo)) * (conc - cLo) + iLo;
    return Math.round(aqi);
  }

  return 0;
}

/**
 * Identifies the dominant pollutant from ambient concentration readings in µg/m³.
 * Converts each concentration to its EPA sub-index and selects the highest sub-index.
 * Missing, null, undefined, or NaN readings are safely skipped.
 * @param {Record<string, number | null | undefined>} readings - Measured concentrations in µg/m³.
 * @returns {{ pollutant: string, value: number, subIndex: number, aqi: number, ratio: number } | null}
 */
export function getDominantPollutant(readings) {
  if (!readings || typeof readings !== 'object') {
    return null;
  }

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

  if (validCount === 0) {
    return null;
  }

  if (!dominant) {
    dominant = {
      pollutant: 'pm2_5',
      value: 0,
      subIndex: 0,
      aqi: 0,
      ratio: 0
    };
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
