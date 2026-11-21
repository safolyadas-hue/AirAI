/**
 * Centralized Application Store
 * Provides state management and pub/sub listener subscriptions.
 */
import { createDefaultProfile } from '../domain/profile.js';

const STORAGE_KEY_PROFILE = 'cleanair_user_profile';

/**
 * @typedef {Object} AppState
 * @property {import('../domain/profile.js').UserProfile} profile
 * @property {number | null} currentAqi
 * @property {number | null} currentPm25
 * @property {Array<{ time: string, aqi: number, pm25: number }>} hourlyForecast
 * @property {Array<{ sender: 'user' | 'assistant', text: string }>} chatHistory
 * @property {number} co2SavedKg
 * @property {boolean} isLoading
 */

/** @type {AppState} */
const state = {
  profile: loadSavedProfile(),
  currentAqi: null,
  currentPm25: null,
  hourlyForecast: [],
  chatHistory: [],
  co2SavedKg: 0,
  isLoading: false
};

/** @type {Set<(state: AppState) => void>} */
const listeners = new Set();

/**
 * Loads profile from localStorage with fallback to default.
 * @returns {import('../domain/profile.js').UserProfile}
 */
function loadSavedProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (raw) {
      return createDefaultProfile(JSON.parse(raw));
    }
  } catch {
    // Ignore storage parse errors
  }
  return createDefaultProfile();
}

/**
 * Returns a read-only snapshot of the current state.
 * @returns {AppState}
 */
export function getState() {
  return state;
}

/**
 * Subscribes a callback to state changes.
 * @param {(state: AppState) => void} listener
 * @returns {() => void} Unsubscribe function.
 */
export function subscribe(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Updates application state and notifies subscribers.
 * @param {Partial<AppState>} updates
 */
export function setState(updates) {
  Object.assign(state, updates);
  if (updates.profile) {
    try {
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(state.profile));
    } catch {
      // Storage write error handling
    }
  }
  listeners.forEach((listener) => listener(state));
}
