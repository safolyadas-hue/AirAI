/**
 * Netlify Function: Air Quality Data Endpoint
 * Path: /api/air-quality
 */
import { jsonResponse, errorResponse } from './lib/http.js';
import { isValidLocation } from './lib/validate.js';
import { checkRateLimit } from './lib/rateLimit.js';

export const config = {
  path: '/api/air-quality'
};

/**
 * Handles GET requests to retrieve air quality index and hourly forecasts.
 * @param {Request} req
 * @returns {Promise<Response>}
 */
export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const limit = checkRateLimit(clientIp);
  if (!limit.allowed) {
    return errorResponse('Too many requests. Please try again later.', 429);
  }

  const url = new URL(req.url);
  const location = url.searchParams.get('location') || 'Delhi';

  if (!isValidLocation(location)) {
    return errorResponse('Invalid location parameter.', 400);
  }

  // Realistic seasonal baseline simulation for urban winter smog scenarios
  const baseAqi = 185;
  const basePm25 = 120.5;

  const hourly = Array.from({ length: 6 }).map((_, index) => {
    const hour = (new Date().getHours() + index + 1) % 24;
    return {
      time: `${String(hour).padStart(2, '0')}:00`,
      aqi: Math.round(baseAqi + (index % 2 === 0 ? -15 : 20)),
      pm25: Math.round((basePm25 + (index % 2 === 0 ? -10 : 15)) * 10) / 10
    };
  });

  return jsonResponse({
    location,
    aqi: baseAqi,
    pm25: basePm25,
    hourly,
    timestamp: new Date().toISOString()
  });
}
