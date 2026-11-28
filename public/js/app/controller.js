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
  document.documentElement.setAttribute('data-aqi', AQI_THEME_MAP[cat.id] || 'unhealthy');
}

/**
 * Reads saved view tab from localStorage safely.
 * @returns {string}
 */
function readSavedView() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB);
    if (NAV_TABS.some((t) => t.id === stored)) return /** @type {string} */ (stored);
  } catch {
    // Ignore storage read error
  }
  return 'today';
}

/**
 * Attaches online/offline and visibilitychange listeners.
 * @param {typeof defaultStore} store
 * @param {() => void} onStaleVisible
 * @returns {() => void}
 */
function attachLifecycleListeners(store, onStaleVisible) {
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
      onStaleVisible();
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
  }
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisibility);

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

/**
 * Creates the application controller with injectable store and API dependencies.
 * @param {{ store?: typeof defaultStore, api?: typeof defaultApi }} [deps={}]
 * @returns {object}
 */
export function createController({ store = defaultStore, api = defaultApi } = {}) {
  let latestAdviceRequestId = 0;

  async function fetchAdviceAsync(profile, airSnapshot, rulesOutput) {
    const requestId = ++latestAdviceRequestId;
    store.set({ adviceStatus: 'loading' });
    try {
      const advice = await api.getAdvice({ profile, airSnapshot, rulesOutput });
      if (requestId !== latestAdviceRequestId) return;
      store.set({ advice, adviceStatus: advice?.fallback ? 'fallback' : 'ready' });
    } catch {
      if (requestId === latestAdviceRequestId) store.set({ adviceStatus: 'error' });
    }
  }

  async function loadLiveAirData({ bypassCache = false } = {}) {
    const { profile } = store.get();
    if (!profile) return;
    latestAdviceRequestId += 1;
    store.set({ status: 'loading', error: null, advice: null, adviceStatus: 'idle' });
    try {
      const air = await api.getAirQuality(profile.location.lat, profile.location.lon, {
        bypassCache
      });
      const hourly = analyzeHourlyForecast(air.hourly);
      const rules = evaluateRules(profile, air.airSnapshot, hourly);
      applyAqiTheme(air.airSnapshot.aqi);
      store.set({ air, hourly, rules, status: 'ready', error: null, lastUpdatedAt: Date.now() });
      fetchAdviceAsync(profile, air.airSnapshot, rules);
    } catch (err) {
      store.set({
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to load air quality data'
      });
    }
  }

  function submitProfile(rawProfile, { quickStart = false } = {}) {
    const candidate = quickStart
      ? createDefaultProfile({ location: rawProfile?.location })
      : rawProfile;
    const result = validateProfile(candidate);
    if (!result.valid) return { valid: false, errors: result.errors };
    store.set({ profile: result.value, isEditingProfile: false });
    loadLiveAirData({ bypassCache: false });
    return { valid: true, errors: [] };
  }

  function setView(tabId) {
    if (!NAV_TABS.some((t) => t.id === tabId)) return;
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, tabId);
    } catch {
      // Ignore storage write error
    }
    store.set({ view: tabId });
  }

  function init() {
    store.set({
      view: readSavedView(),
      isOffline: typeof navigator !== 'undefined' ? navigator.onLine === false : false
    });
    const cleanup = attachLifecycleListeners(store, () => loadLiveAirData({ bypassCache: true }));
    if (store.get().profile) loadLiveAirData({ bypassCache: false });
    return cleanup;
  }

  return {
    init,
    validateDraft: (raw) => validateProfile(raw),
    submitProfile,
    startEditProfile: () => store.set({ isEditingProfile: true }),
    cancelEditProfile: () => store.get().profile && store.set({ isEditingProfile: false }),
    refreshAirData: () => loadLiveAirData({ bypassCache: true }),
    setView,
    searchLocations: (q) => api.searchCity(q),
    loadLiveAirData
  };
}

export const controller = createController();
