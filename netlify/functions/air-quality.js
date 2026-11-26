/**
 * Netlify Function: Air Quality & Geocoding Endpoint
 * Path: /api/air-quality
 *
 * Normalizes Open-Meteo Air Quality and Forecast data directly into the exact shapes
 * expected by /public/js/domain pure functions (evaluateRules and analyzeHourlyForecast).
 */
import { json, errorResponse, methodGuard } from './lib/http.js';
import { isValidLat, isValidLon, validateCityQuery } from './lib/validate.js';
import { enforceRateLimit } from './lib/rateLimit.js';
import { getDominantPollutant } from '../../public/js/domain/aqi.js';

export const config = {
  path: '/api/air-quality'
};

const TIMEOUT_MS = 8000; // 8s timeout per external request
const CACHE_HEADER = { 'Cache-Control': 'public, max-age=600' };

/**
 * Executes a fetch with a 5-second timeout controller.
 * @param {string} url
 * @param {URLSearchParams} params
 * @returns {Promise<any>}
 */
async function fetchWithTimeout(url, params) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const fullUrl = `${url}?${params.toString()}`;
    const res = await fetch(fullUrl, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) {
      throw new Error(`Upstream service returned HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    clearTimeout(timer);
    const isAbort = err instanceof Error && err.name === 'AbortError';
    throw new Error(
      isAbort ? 'Upstream request timed out' : err instanceof Error ? err.message : 'Fetch failed'
    );
  }
}

/**
 * Fetches and normalizes geocoding candidates from Open-Meteo.
 * Caps results at 5 and strips all non-whitelisted upstream properties.
 * @param {string} query
 * @returns {Promise<Array<import('./lib/types.js').GeocodingLocationResult>>}
 */
async function searchGeocoding(query) {
  const params = new URLSearchParams({
    name: query,
    count: '5',
    language: 'en',
    format: 'json'
  });
  const data = await fetchWithTimeout('https://geocoding-api.open-meteo.com/v1/search', params);
  const rawResults = Array.isArray(data?.results) ? data.results : [];

  return rawResults.slice(0, 5).map((item) => {
    const name = typeof item.name === 'string' ? item.name.trim() : '';
    const admin1 = typeof item.admin1 === 'string' ? item.admin1.trim() : '';
    const country = typeof item.country === 'string' ? item.country.trim() : '';
    const countryCode =
      typeof item.country_code === 'string'
        ? item.country_code.trim()
        : typeof item.countryCode === 'string'
          ? item.countryCode.trim()
          : '';
    const timezone = typeof item.timezone === 'string' ? item.timezone.trim() : '';

    const label = admin1
      ? `${name}, ${admin1}, ${country}`
      : country
        ? `${name}, ${country}`
        : name;

    return {
      id: item.id,
      name,
      latitude: item.latitude,
      longitude: item.longitude,
      admin1,
      country,
      countryCode,
      timezone,
      label
    };
  });
}

/**
 * Fetches and normalizes air quality and weather data into domain shapes.
 * @param {number} lat
 * @param {number} lon
 * @param {string} [name='Target Location']
 * @returns {Promise<import('./lib/types.js').NormalizedAirQualityResponse>}
 */
async function fetchNormalizedAirData(lat, lon, name = 'Target Location') {
  const airParams = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone,sulphur_dioxide,carbon_monoxide',
    hourly: 'us_aqi,pm2_5',
    forecast_days: '2'
  });

  const weatherParams = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: 'temperature_2m,wind_speed_10m,relative_humidity_2m',
    forecast_days: '2'
  });

  const [airData, weatherData] = await Promise.all([
    fetchWithTimeout('https://air-quality-api.open-meteo.com/v1/air-quality', airParams),
    fetchWithTimeout('https://api.open-meteo.com/v1/forecast', weatherParams)
  ]);

  const current = airData.current || {};
  const readings = {
    pm2_5: current.pm2_5 ?? 0,
    pm10: current.pm10 ?? 0,
    no2: current.nitrogen_dioxide ?? 0,
    o3: current.ozone ?? 0,
    so2: current.sulphur_dioxide ?? 0,
    co: current.carbon_monoxide ?? 0
  };

  const currentAqi = current.us_aqi ?? 50;
  const dominantPollutant = getDominantPollutant(readings);

  const hourlyAir = airData.hourly || {};
  const hourlyWeather = weatherData.hourly || {};
  const times = hourlyAir.time || [];

  const hourly = times.map((t, i) => ({
    time: t,
    aqi: hourlyAir.us_aqi?.[i] ?? 50,
    pm25: hourlyAir.pm2_5?.[i] ?? 15,
    windSpeed: hourlyWeather.wind_speed_10m?.[i] ?? 10,
    temperature: hourlyWeather.temperature_2m?.[i] ?? 20,
    humidity: hourlyWeather.relative_humidity_2m?.[i] ?? 50
  }));

  return {
    location: { name, lat, lon },
    airSnapshot: {
      aqi: currentAqi,
      pm2_5: readings.pm2_5,
      pm10: readings.pm10,
      no2: readings.no2,
      o3: readings.o3,
      so2: readings.so2,
      co: readings.co,
      dominantPollutant
    },
    hourly,
    aqi: currentAqi,
    pm25: readings.pm2_5,
    timestamp: new Date().toISOString()
  };
}

/**
 * Handles incoming air quality and geocoding requests.
 * @param {Request} req
 * @returns {Promise<Response>}
 */
export default async function handler(req) {
  const methodBlock = methodGuard(req, ['GET']);
  if (methodBlock) return methodBlock;

  const rateBlock = enforceRateLimit(req, 'data');
  if (rateBlock) return rateBlock;

  const url = new URL(req.url);
  const q = url.searchParams.get('q');
  const locationParam = url.searchParams.get('location');
  const latStr = url.searchParams.get('lat');
  const lonStr = url.searchParams.get('lon');

  try {
    // Branch 1: City Search Query (e.g. /api/air-quality?q=Delhi)
    if (q) {
      const qCheck = validateCityQuery(q);
      if (!qCheck.valid) {
        return errorResponse(qCheck.error || 'Invalid query', 400);
      }
      const results = await searchGeocoding(qCheck.sanitized);
      return json({ results }, 200, CACHE_HEADER);
    }

    // Branch 2: Direct Coordinates (e.g. /api/air-quality?lat=28.6&lon=77.2)
    if (latStr !== null && lonStr !== null) {
      if (!isValidLat(latStr) || !isValidLon(lonStr)) {
        return errorResponse('Latitude must be -90..90 and longitude -180..180', 400);
      }
      const lat = parseFloat(latStr);
      const lon = parseFloat(lonStr);
      const name = url.searchParams.get('name') || `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
      const normalized = await fetchNormalizedAirData(lat, lon, name);
      return json(normalized, 200, CACHE_HEADER);
    }

    // Branch 3: Named Location Lookup (e.g. /api/air-quality?location=London)
    if (locationParam) {
      const locCheck = validateCityQuery(locationParam);
      if (!locCheck.valid) {
        return errorResponse('Invalid location name parameter', 400);
      }
      const candidates = await searchGeocoding(locCheck.sanitized);
      if (candidates.length === 0) {
        return errorResponse(`No geographic coordinates found for "${locCheck.sanitized}"`, 404);
      }
      const primary = candidates[0];
      const normalized = await fetchNormalizedAirData(
        primary.latitude,
        primary.longitude,
        primary.name
      );
      return json(normalized, 200, CACHE_HEADER);
    }

    return errorResponse(
      'Missing required query parameters: supply either lat & lon, or q/location',
      400
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Air quality fetch failed';
    return errorResponse(`Unable to retrieve air quality data: ${message}`, 502);
  }
}
