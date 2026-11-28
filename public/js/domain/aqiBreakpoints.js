/**
 * US EPA AQI Breakpoints, Unit Conversion Factors & Categories
 * Pure data constants: zero DOM or network access.
 * Source: US EPA Air Quality Index (AQI) Standards & NAAQS 40 CFR Part 58 Appendix G
 */

export const POLLUTANT_REFERENCE_THRESHOLDS = Object.freeze({
  pm2_5: 35.0,
  pm10: 150.0,
  no2: 100.0,
  o3: 70.0,
  so2: 75.0,
  co: 9.0
});

/**
 * Conversion factors from Open-Meteo µg/m³ concentrations to standard EPA AQI reporting units.
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
 * EPA Official Breakpoints Table (40 CFR Part 58 Appendix G).
 * Format per bracket: [C_lo, C_hi, I_lo, I_hi]
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
 * US AQI Categories configuration array.
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
