/**
 * Application Constants and Thresholds
 * Source: US EPA AQI Standards & WHO Global Air Quality Guidelines 2021
 */
export const AQI_BREAKPOINTS = Object.freeze({
  GOOD: { min: 0, max: 50, label: 'good', color: '#007a3d' },
  MODERATE: { min: 51, max: 100, label: 'moderate', color: '#946800' },
  UNHEALTHY_SENSITIVE: { min: 101, max: 150, label: 'unhealthySensitive', color: '#c44000' },
  UNHEALTHY: { min: 151, max: 200, label: 'unhealthy', color: '#b3001e' },
  VERY_UNHEALTHY: { min: 201, max: 300, label: 'veryUnhealthy', color: '#6b007b' },
  HAZARDOUS: { min: 301, max: 500, label: 'hazardous', color: '#590024' }
});

/**
 * Standard emission and indoor air quality impact factors
 * Source: DEFRA Greenhouse Gas Conversion Factors & EPA Household Exposure Model
 */
export const IMPACT_CONSTANTS = Object.freeze({
  // kg CO2 equivalent saved per km by replacing car with walking/cycling
  CAR_EMISSION_FACTOR_PER_KM: 0.171,
  // kg CO2 saved per km using metro/electric transit instead of single-occupancy car
  TRANSIT_SAVINGS_PER_KM: 0.103,
  // Approximate microgram/m3 PM2.5 reduction indoors with sealed doors & HEPA filter
  HEPA_REDUCTION_PERCENTAGE: 0.85,
  // Natural indoor plants VOC reduction baseline index (NASA Clean Air Study)
  PLANT_AIR_CLEANING_INDEX: 1.15
});

export const API_ENDPOINTS = Object.freeze({
  AIR_QUALITY: '/api/air-quality',
  ADVICE: '/api/advice',
  CHAT: '/api/chat'
});

/**
 * Flag controlling temporary demo mode for visual design system validation.
 * Temporary demo preview control; will be removed in Step 5 when live data is fully wired.
 */
export const DEMO_MODE = true;

/**
 * Maps pure domain AQI category identifiers from aqi.js to CSS data-aqi theme attribute values.
 */
export const AQI_THEME_MAP = Object.freeze({
  good: 'good',
  moderate: 'moderate',
  unhealthy_sensitive: 'usg',
  unhealthy: 'unhealthy',
  very_unhealthy: 'very-unhealthy',
  hazardous: 'hazardous'
});

/**
 * Primary navigation views supported in the Clear Sky app shell.
 */
export const NAV_TABS = Object.freeze([
  { id: 'today', icon: 'wind' },
  { id: 'plan', icon: 'shield' },
  { id: 'indoor', icon: 'home' },
  { id: 'swaps', icon: 'leaf' },
  { id: 'ask', icon: 'chat' },
  { id: 'impact', icon: 'bike' }
]);

/**
 * Storage keys for persistent UI preferences.
 */
export const STORAGE_KEYS = Object.freeze({
  THEME: 'cleanair_theme_pref',
  FONT_SIZE: 'cleanair_font_size_pref',
  PROFILE: 'cleanair_user_profile',
  ACTIVE_TAB: 'cleanair_active_tab'
});
