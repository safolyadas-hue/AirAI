/**
 * Shared Type Definitions for CleanAir Companion Netlify Functions
 * Matches pure domain signatures in /public/js/domain exactly.
 */

/**
 * @typedef {Object} DominantPollutant
 * @property {string} pollutant - E.g. 'pm2_5', 'pm10', 'no2', 'o3', 'so2', 'co'
 * @property {number} value - Measured ambient concentration
 * @property {number} ratio - Ratio relative to standard threshold
 */

/**
 * Air Quality Snapshot matching /public/js/domain/rules.js expectations
 * @typedef {Object} AirSnapshot
 * @property {number} aqi - US Air Quality Index (0-500+)
 * @property {number} pm2_5 - PM2.5 in µg/m³
 * @property {number} pm10 - PM10 in µg/m³
 * @property {number} [no2] - NO2 in ppb or µg/m³
 * @property {number} [o3] - Ozone in ppb or µg/m³
 * @property {number} [so2] - SO2 in ppb or µg/m³
 * @property {number} [co] - Carbon monoxide in ppm or mg/m³
 * @property {DominantPollutant | null} [dominantPollutant] - Primary pollutant driver
 */

/**
 * Hourly data point matching /public/js/domain/hourly.js analyzeHourlyForecast
 * @typedef {Object} HourlyPoint
 * @property {string} time - ISO timestamp or hour string (e.g. "2026-11-21T14:00" or "14:00")
 * @property {number} aqi - Forecasted US AQI
 * @property {number} pm25 - Forecasted PM2.5 concentration in µg/m³
 * @property {number} windSpeed - Wind speed in km/h
 * @property {number} temperature - Ambient temperature in °C
 * @property {number} humidity - Relative humidity in %
 */

/**
 * Normalized response returned by GET /api/air-quality?lat=&lon=
 * @typedef {Object} NormalizedAirQualityResponse
 * @property {{ name: string, lat: number, lon: number }} location
 * @property {AirSnapshot} airSnapshot
 * @property {HourlyPoint[]} hourly
 * @property {number} aqi - Top-level alias for convenient binding
 * @property {number} pm25 - Top-level alias for convenient binding
 * @property {string} timestamp
 */

/**
 * Geocoding search candidate result
 * @typedef {Object} GeocodingLocationResult
 * @property {number} id
 * @property {string} name
 * @property {number} latitude
 * @property {number} longitude
 * @property {string} country
 * @property {string} [admin1]
 */

/**
 * GenAI Advice Output schema
 * @typedef {Object} AdviceOutput
 * @property {string} summary - 2-3 sentence overview
 * @property {string} familyNarrative - Personalized story for this household
 * @property {{ morning: string, commute: string, midday: string, evening: string, night: string }} dailyPlan
 * @property {string[]} indoorTips
 * @property {string[]} swaps
 * @property {Array<{ actionId: string, explanation: string }>} impactExplanations
 * @property {string} motivation
 * @property {boolean} [fallback]
 */

export {};
