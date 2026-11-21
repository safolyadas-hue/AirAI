/**
 * Hourly Forecast Analysis and Air Quality Window Discovery
 * Pure functions: zero DOM or network access.
 */

/**
 * @typedef {Object} HourlyForecastPoint
 * @property {string} time - ISO or time string (e.g. "14:00")
 * @property {number} aqi - Forecasted AQI value
 * @property {number} pm25 - Forecasted PM2.5 concentration
 */

/**
 * Identifies the best window (lowest AQI) during the upcoming hours.
 * @param {HourlyForecastPoint[]} forecast - Array of hourly forecasts.
 * @returns {HourlyForecastPoint | null} Point with the minimum AQI.
 */
export function findBestAirWindow(forecast) {
  if (!Array.isArray(forecast) || forecast.length === 0) {
    return null;
  }

  let bestPoint = forecast[0];
  for (let i = 1; i < forecast.length; i++) {
    if (forecast[i].aqi < bestPoint.aqi) {
      bestPoint = forecast[i];
    }
  }

  return bestPoint;
}

/**
 * Filters forecast points that are within safe limits for outdoor exercise.
 * @param {HourlyForecastPoint[]} forecast
 * @param {number} [maxSafeAqi=100]
 * @returns {HourlyForecastPoint[]}
 */
export function getSafeExerciseWindows(forecast, maxSafeAqi = 100) {
  if (!Array.isArray(forecast)) {
    return [];
  }
  return forecast.filter((point) => point.aqi <= maxSafeAqi);
}
