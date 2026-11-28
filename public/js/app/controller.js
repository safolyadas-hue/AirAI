/**
 * CleanAir Companion - Application Controller
 * The single orchestration layer connecting services, pure domain logic, and store.
 */
import { AQI_THEME_MAP, CACHE_CONFIG, NAV_TABS, STORAGE_KEYS } from '../config.js';
import { getCategory } from '../domain/aqi.js';
import { analyzeHourlyForecast } from '../domain/hourly.js';
import { validateProfile, createDefaultProfile } from '../domain/profile.js';
import { evaluateRules } from '../domain/rules.js';
import * as defaultApi from '../services/api.js';
import { store as defaultStore } from '../state/store.js';

/**
 * Sets document `data-aqi` attribute in one place using pure getCategory().
 * @param {number} aqi
 */
function applyAqiTheme(aqi) {
  if (typeof document === 'undefined') return;
  const cat = getCategory(aqi);
  const token = AQI_THEME_MAP[cat.id] || 'unhealthy';
  document.documentElement.setAttribute('data-aqi', token);
}

/**
 * Creates the application controller with injectable store and API dependencies.
 * @param {{ store?: typeof defaultStore, api?: typeof defaultApi }} [deps={}]
 * @returns {object}
 */
export function createController({ store = defaultStore, api = defaultApi } = {}) {
  let latestAdviceRequestId = 0;

  /**
   * Requests AI advice asynchronously without blocking rules-based rendering.
   * Ignores stale responses if profile or request ID changed.
   * @param {import('../domain/profile.js').UserProfile} profile
   * @param {any} airSnapshot
   * @param {any} rulesOutput
   */
  async function fetchAdviceAsync(profile, airSnapshot, rulesOutput) {
    const requestId = ++latestAdviceRequestId;
    store.set({ adviceStatus: 'loading' });

    try {
      const advice = await api.getAdvice({ profile, airSnapshot, rulesOutput });
      if (requestId !== latestAdviceRequestId) return;

      if (advice && advice.fallback) {
        store.set({ advice, adviceStatus: 'fallback' });
      } else {
        store.set({ advice, adviceStatus: 'ready' });
      }
    } catch {
      if (requestId !== latestAdviceRequestId) return;
      store.set({ adviceStatus: 'error' });
    }
  }

  /**
   * Fetches live air quality, runs hourly + rules domain analysis, stores results,
   * and triggers asynchronous AI advice.
   * @param {{ bypassCache?: boolean }} [options={}]
   */
  async function loadLiveAirData({ bypassCache = false } = {}) {
    const { profile } = store.get();
    if (!profile) return;

    latestAdviceRequestId += 1;
    store.set({
      status: 'loading',
      error: null,
      advice: null,
      adviceStatus: 'idle'
    });

    try {
      const air = await api.getAirQuality(profile.location.lat, profile.location.lon, {
        bypassCache
      });
      const hourly = analyzeHourlyForecast(air.hourly);
      const rules = evaluateRules(profile, air.airSnapshot, hourly);

      applyAqiTheme(air.airSnapshot.aqi);

      store.set({
        air,
        hourly,
        rules,
        status: 'ready',
        error: null,
        lastUpdatedAt: Date.now()
      });

      fetchAdviceAsync(profile, air.airSnapshot, rules);
    } catch (err) {
      store.set({
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to load air quality data'
      });
    }
  }

  /**
   * Validates and persists a submitted user profile, then loads live air data.
   * @param {Record<string, any>} rawProfile
   * @param {{ quickStart?: boolean }} [options={}]
   * @returns {{ valid: boolean, errors: string[] }}
   */
  function submitProfile(rawProfile, { quickStart = false } = {}) {
    const candidate = quickStart
      ? createDefaultProfile({ location: rawProfile?.location })
      : rawProfile;
    const result = validateProfile(candidate);
    if (!result.valid) {
      return { valid: false, errors: result.errors };
    }

    store.set({
      profile: result.value,
      isEditingProfile: false
    });
    loadLiveAirData({ bypassCache: false });
    return { valid: true, errors: [] };
  }

  /**
   * Opens the onboarding wizard to edit the current profile.
   */
  function startEditProfile() {
    store.set({ isEditingProfile: true });
  }

  /**
   * Cancels profile editing when a valid profile already exists.
   */
  function cancelEditProfile() {
    if (store.get().profile) {
      store.set({ isEditingProfile: false });
    }
  }

  /**
   * Forces a fresh air quality fetch bypassing the 10-minute cache.
   */
  function refreshAirData() {
    return loadLiveAirData({ bypassCache: true });
  }

  /**
   * Switches the active navigation view and persists tab selection.
   * @param {string} tabId
   */
  function setView(tabId) {
    if (!NAV_TABS.some((t) => t.id === tabId)) return;
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, tabId);
    } catch {
      // Ignore storage write error
    }
    store.set({ view: tabId });
  }

  /**
   * Searches cities via API service.
   * @param {string} query
   */
  function searchLocations(query) {
    return api.searchCity(query);
  }

  /**
   * Initializes controller listeners (online/offline, visibilitychange) and initial fetch.
   * @returns {() => void} Cleanup function.
   */
  function init() {
    let savedView = 'today';
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB);
      if (NAV_TABS.some((t) => t.id === stored)) {
        savedView = /** @type {string} */ (stored);
      }
    } catch {
      // Ignore storage read error
    }

    store.set({
      view: savedView,
      isOffline: typeof navigator !== 'undefined' ? navigator.onLine === false : false
    });

    const onOnline = () => store.set({ isOffline: false });
    const onOffline = () => store.set({ isOffline: true });
    const onVisibility = () => {
      if (typeof document === 'undefined' || document.visibilityState !== 'visible') return;
      const { profile, lastUpdatedAt, status } = store.get();
      if (
        profile &&
        status !== 'loading' &&
        lastUpdatedAt &&
        Date.now() - lastUpdatedAt > CACHE_CONFIG.AUTO_REFRESH_STALE_MS
      ) {
        refreshAirData();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', onOnline);
      window.addEventListener('offline', onOffline);
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibility);
    }

    if (store.get().profile) {
      loadLiveAirData({ bypassCache: false });
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', onOnline);
        window.removeEventListener('offline', onOffline);
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibility);
      }
    };
  }

  return {
    init,
    submitProfile,
    startEditProfile,
    cancelEditProfile,
    refreshAirData,
    setView,
    searchLocations,
    loadLiveAirData
  };
}

export const controller = createController();
