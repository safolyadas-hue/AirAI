/**
 * Centralized Application Store
 * Minimal observable store persisting ONLY profile (and theme via a11y.js) in localStorage.
 * Air data, advice, and chat are strictly in-memory.
 */
import { STORAGE_KEYS } from '../config.js';
import { validateProfile } from '../domain/profile.js';

/**
 * @typedef {Object} AppState
 * @property {import('../domain/profile.js').UserProfile | null} profile
 * @property {import('../../../netlify/functions/lib/types.js').NormalizedAirQualityResponse | null} air
 * @property {{ bestWindow: any, worstWindow: any, stagnationRisk: 'low'|'moderate'|'high', dataPointsCount: number } | null} hourly
 * @property {{ riskLevel: string, vulnerableHousehold: boolean, headline: string, actions: Array<any> } | null} rules
 * @property {import('../../../netlify/functions/lib/types.js').AdviceOutput | null} advice
 * @property {'idle' | 'loading' | 'ready' | 'fallback' | 'error'} adviceStatus
 * @property {'idle' | 'loading' | 'ready' | 'error'} status
 * @property {string | null} error
 * @property {string} view
 * @property {number | null} lastUpdatedAt
 * @property {boolean} isOffline
 * @property {boolean} isEditingProfile
 */

/**
 * Loads and validates stored user profile from localStorage.
 * Discards corrupt or incomplete data safely.
 * @returns {import('../domain/profile.js').UserProfile | null}
 */
function loadSavedProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !parsed.location ||
      typeof parsed.location.name !== 'string' ||
      !parsed.location.name.trim() ||
      typeof parsed.location.lat !== 'number' ||
      typeof parsed.location.lon !== 'number'
    ) {
      localStorage.removeItem(STORAGE_KEYS.PROFILE);
      return null;
    }
    const result = validateProfile(parsed);
    if (!result.valid) {
      localStorage.removeItem(STORAGE_KEYS.PROFILE);
      return null;
    }
    return result.value;
  } catch {
    try {
      localStorage.removeItem(STORAGE_KEYS.PROFILE);
    } catch {
      // Ignore storage removal errors
    }
    return null;
  }
}

/**
 * Persists only the user profile to localStorage inside try/catch.
 * @param {import('../domain/profile.js').UserProfile | null} profile
 */
function persistProfile(profile) {
  try {
    if (profile === null) {
      localStorage.removeItem(STORAGE_KEYS.PROFILE);
    } else {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    }
  } catch {
    // Ignore storage write errors (quota/private mode)
  }
}

/**
 * Creates a fresh store instance (exported for testing).
 * @param {Partial<AppState>} [initialOverrides={}]
 * @returns {{ get: () => AppState, set: (updates: Partial<AppState> | ((s: AppState) => Partial<AppState>)) => void, subscribe: (listener: (s: AppState) => void) => () => void }}
 */
export function createStore(initialOverrides = {}) {
  /** @type {AppState} */
  let state = {
    profile: loadSavedProfile(),
    air: null,
    hourly: null,
    rules: null,
    advice: null,
    adviceStatus: 'idle',
    status: 'idle',
    error: null,
    view: 'today',
    lastUpdatedAt: null,
    isOffline: typeof navigator !== 'undefined' ? navigator.onLine === false : false,
    isEditingProfile: false,
    ...initialOverrides
  };

  /** @type {Set<(state: AppState) => void>} */
  const listeners = new Set();

  /**
   * Returns current state snapshot.
   * @returns {AppState}
   */
  function get() {
    return state;
  }

  /**
   * Updates state and notifies subscribers. Persists only profile changes.
   * @param {Partial<AppState> | ((s: AppState) => Partial<AppState>)} updates
   */
  function set(updates) {
    const patch = typeof updates === 'function' ? updates(state) : updates;
    if (!patch || typeof patch !== 'object') return;
    const prevProfile = state.profile;
    state = { ...state, ...patch };
    if (Object.prototype.hasOwnProperty.call(patch, 'profile') && state.profile !== prevProfile) {
      persistProfile(state.profile);
    }
    listeners.forEach((listener) => listener(state));
  }

  /**
   * Subscribes a listener to state updates.
   * @param {(state: AppState) => void} listener
   * @returns {() => void} Unsubscribe function.
   */
  function subscribe(listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  return { get, set, subscribe };
}

export const store = createStore();
export const getState = () => store.get();
export const setState = (updates) => store.set(updates);
export const subscribe = (listener) => store.subscribe(listener);
