/**
 * Hourly Forecast Analysis and Air Quality Window Discovery
 * Pure functions: zero DOM or network access.
 * Source: NOAA / US EPA Meteorological Stagnation & Inversion Research
 */

/**
 * Atmospheric Stagnation & Temperature Inversion Thresholds
 * Source: US National Weather Service Stagnation Index & EPA Guideline on Air Quality Models
 *
 * Ground temperature inversions trap particulates near breathing zones during winter smog:
 * - Wind speed <= 5.0 km/h: light/calm wind prevents horizontal dispersion.
 * - Temperature <= 10.0 °C: radiative ground cooling triggers nocturnal/morning boundary layer collapse.
 * - Relative humidity >= 70%: hygroscopic aerosol swelling and secondary smog particle synthesis.
 */
export const METEOROLOGICAL_THRESHOLDS = Object.freeze({
  STAGNATION_WIND_SPEED_MAX_KMH: 5.0,
  STAGNATION_TEMP_MAX_CELSIUS: 10.0,
  STAGNATION_HUMIDITY_MIN_PERCENT: 70.0
});

/**
 * @typedef {Object} HourlyDataPoint
 * @property {string | number} time - Hour label or timestamp (e.g. "14:00" or 14)
 * @property {number} aqi - Air Quality Index forecast value
 * @property {number} [pm25] - PM2.5 concentration in µg/m³
 * @property {number} [windSpeed] - Wind speed in km/h
 * @property {number} [temperature] - Ambient temperature in °C
 * @property {number} [humidity] - Relative humidity in %
 */

/**
 * Computes atmospheric stagnation risk level based on meteorological conditions.
 * @param {number} [windSpeed] - Wind speed in km/h.
 * @param {number} [temperature] - Temperature in °C.
 * @param {number} [humidity] - Relative humidity percentage (0-100).
 * @returns {'low' | 'moderate' | 'high'} Stagnation risk level.
 */
export function computeStagnationRisk(windSpeed, temperature, humidity) {
  let score = 0;

  if (typeof windSpeed === 'number' && !Number.isNaN(windSpeed)) {
    if (windSpeed <= METEOROLOGICAL_THRESHOLDS.STAGNATION_WIND_SPEED_MAX_KMH) {
      score += 1;
    }
  }

  if (typeof temperature === 'number' && !Number.isNaN(temperature)) {
    if (temperature <= METEOROLOGICAL_THRESHOLDS.STAGNATION_TEMP_MAX_CELSIUS) {
      score += 1;
    }
  }

  if (typeof humidity === 'number' && !Number.isNaN(humidity)) {
    if (humidity >= METEOROLOGICAL_THRESHOLDS.STAGNATION_HUMIDITY_MIN_PERCENT) {
      score += 1;
    }
  }

  if (score >= 3) return 'high';
  if (score >= 2) return 'moderate';
  return 'low';
}

/**
 * Extracts and normalizes hourly input points.
 * @param {any} input
 * @returns {HourlyDataPoint[]}
 */
function normalizeHourlyPoints(input) {
  if (Array.isArray(input)) {
    return input.map((pt, idx) => {
      if (typeof pt === 'number') {
        return { time: `${idx}:00`, aqi: pt };
      }
      return {
        time: pt?.time ?? `${idx}:00`,
        aqi: typeof pt?.aqi === 'number' ? pt.aqi : 100,
        pm25: pt?.pm25,
        windSpeed: pt?.windSpeed,
        temperature: pt?.temperature,
        humidity: pt?.humidity
      };
    });
  }
  return [];
}

/**
 * Analyzes the next 24-hour forecast for best/worst outdoor windows and inversion stagnation risk.
 * @param {HourlyDataPoint[] | number[]} hourlyData - Hourly forecast items.
 * @param {number[]} [windSpeeds] - Optional parallel wind speeds array.
 * @param {number[]} [temperatures] - Optional parallel temperatures array.
 * @param {number[]} [humidities] - Optional parallel humidities array.
 * @returns {{
 *   bestWindow: HourlyDataPoint | null,
 *   worstWindow: HourlyDataPoint | null,
 *   stagnationRisk: 'low' | 'moderate' | 'high',
 *   dataPointsCount: number
 * }}
 */
export function analyzeHourlyForecast(
  hourlyData,
  windSpeeds = [],
  temperatures = [],
  humidities = []
) {
  const points = normalizeHourlyPoints(hourlyData);

  if (points.length === 0) {
    return {
      bestWindow: null,
      worstWindow: null,
      stagnationRisk: 'low',
      dataPointsCount: 0
    };
  }

  // Merge parallel arrays if provided
  points.forEach((pt, i) => {
    if (pt.windSpeed === undefined && typeof windSpeeds[i] === 'number')
      pt.windSpeed = windSpeeds[i];
    if (pt.temperature === undefined && typeof temperatures[i] === 'number')
      pt.temperature = temperatures[i];
    if (pt.humidity === undefined && typeof humidities[i] === 'number') pt.humidity = humidities[i];
  });

  let best = points[0];
  let worst = points[0];
  let highStagnationHours = 0;
  let modStagnationHours = 0;

  for (const pt of points) {
    if (pt.aqi < best.aqi) best = pt;
    if (pt.aqi > worst.aqi) worst = pt;

    const risk = computeStagnationRisk(pt.windSpeed, pt.temperature, pt.humidity);
    if (risk === 'high') highStagnationHours += 1;
    else if (risk === 'moderate') modStagnationHours += 1;
  }

  let stagnationRisk = 'low';
  if (highStagnationHours >= 4 || (highStagnationHours >= 2 && modStagnationHours >= 4)) {
    stagnationRisk = 'high';
  } else if (highStagnationHours >= 1 || modStagnationHours >= 3) {
    stagnationRisk = 'moderate';
  }

  return {
    bestWindow: best,
    worstWindow: worst,
    stagnationRisk: /** @type {'low' | 'moderate' | 'high'} */ (stagnationRisk),
    dataPointsCount: points.length
  };
}

/**
 * Backward compatibility: finds single point with lowest AQI.
 * @param {HourlyDataPoint[]} forecast
 * @returns {HourlyDataPoint | null}
 */
export function findBestAirWindow(forecast) {
  const res = analyzeHourlyForecast(forecast);
  return res.bestWindow;
}

/**
 * Backward compatibility: filters forecast points within safe limits for outdoor exercise.
 * @param {HourlyDataPoint[]} forecast
 * @param {number} [maxSafeAqi=100]
 * @returns {HourlyDataPoint[]}
 */
export function getSafeExerciseWindows(forecast, maxSafeAqi = 100) {
  const points = normalizeHourlyPoints(forecast);
  return points.filter((p) => p.aqi <= maxSafeAqi);
}
