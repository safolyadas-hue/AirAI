/**
 * API Service for CleanAir Companion
 * Handles network requests to Netlify Functions endpoints.
 */
import { API_ENDPOINTS } from '../config.js';

/**
 * Fetches current and forecasted air quality data for a given location.
 * @param {string} location - Location name or coordinates.
 * @returns {Promise<{ aqi: number, pm25: number, hourly: Array<{ time: string, aqi: number, pm25: number }> }>}
 */
export async function fetchAirQuality(location) {
  const query = encodeURIComponent(location);
  const response = await fetch(`${API_ENDPOINTS.AIR_QUALITY}?location=${query}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch air quality data: ${response.status}`);
  }
  return response.json();
}

/**
 * Requests GenAI advice based on air quality metrics and user profile.
 * @param {number} aqi - Current AQI.
 * @param {import('../domain/profile.js').UserProfile} profile - Household profile.
 * @returns {Promise<{ advice: string, actions: string[] }>}
 */
export async function fetchAiAdvice(aqi, profile) {
  const response = await fetch(API_ENDPOINTS.ADVICE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ aqi, profile })
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch advice: ${response.status}`);
  }
  return response.json();
}

/**
 * Sends a chat message to the CleanAir Companion GenAI assistant.
 * @param {string} message - User query message.
 * @param {object} context - Contextual state (AQI, profile).
 * @returns {Promise<{ reply: string }>}
 */
export async function sendChatMessage(message, context) {
  const response = await fetch(API_ENDPOINTS.CHAT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, context })
  });
  if (!response.ok) {
    throw new Error(`Chat request failed: ${response.status}`);
  }
  return response.json();
}
