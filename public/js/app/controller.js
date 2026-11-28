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

function applyAqiTheme(aqi) {
  if (typeof document === 'undefined') return;
  const cat = getCategory(aqi);
  document.documentElement.setAttribute('data-aqi', AQI_THEME_MAP[cat.id] || 'unhealthy');
}

function readSavedView() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB);
    if (NAV_TABS.some((t) => t.id === stored)) return /** @type {string} */ (stored);
  } catch {
    /* ignore */
  }
  return 'today';
}

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
    if (typeof document !== 'undefined')
      document.removeEventListener('visibilitychange', onVisibility);
  };
}

function formatChatError(err) {
  if ((typeof navigator !== 'undefined' && navigator.onLine === false) || err?.kind === 'network') {
    return 'You appear to be offline. Please reconnect and try again.';
  }
  if (err?.kind === 'http' && err?.status === 429) {
    return `Please wait ${err.retryAfter || 30} seconds before sending another message.`;
  }
  if (err?.kind === 'timeout') return 'The assistant took too long to respond. Please try again.';
  return 'Could not reach the assistant right now. Please try again.';
}

async function runAirAndAdvice({ store, api, getAdviceSeq, bypassCache }) {
  const { profile } = store.get();
  if (!profile) return;
  const adviceSeq = getAdviceSeq(true);
  store.set({ status: 'loading', error: null, advice: null, adviceStatus: 'idle' });
  try {
    const air = await api.getAirQuality(profile.location.lat, profile.location.lon, {
      bypassCache
    });
    const hourly = analyzeHourlyForecast(air.hourly);
    const rules = evaluateRules(profile, air.airSnapshot, hourly);
    applyAqiTheme(air.airSnapshot.aqi);
    store.set({ air, hourly, rules, status: 'ready', error: null, lastUpdatedAt: Date.now() });
    store.set({ adviceStatus: 'loading' });
    try {
      const advice = await api.getAdvice({
        profile,
        airSnapshot: air.airSnapshot,
        rulesOutput: rules
      });
      if (adviceSeq === getAdviceSeq(false))
        store.set({ advice, adviceStatus: advice?.fallback ? 'fallback' : 'ready' });
    } catch {
      if (adviceSeq === getAdviceSeq(false)) store.set({ adviceStatus: 'error' });
    }
  } catch (err) {
    store.set({
      status: 'error',
      error: err instanceof Error ? err.message : 'Failed to load air quality data'
    });
  }
}

async function runChatSend({ store, api, rawText, getChatSeq }) {
  const text = typeof rawText === 'string' ? rawText.trim() : '';
  if (!text || text.length > 500) return { ok: false };
  const reqId = getChatSeq(true);
  const { chat, profile, air } = store.get();
  const prior = (chat?.messages || []).filter((m) => m.role === 'user' || m.role === 'assistant');
  const history = prior.slice(-10).map((m) => ({ role: m.role, text: m.text }));
  store.set({
    chat: {
      messages: [
        ...prior,
        { id: `u-${reqId}`, role: 'user', text, status: 'sent', isFallback: false }
      ],
      status: 'sending',
      error: null
    }
  });
  try {
    const res = await api.sendChat({
      message: text,
      history,
      profile,
      airSnapshot: air?.airSnapshot || null
    });
    if (reqId !== getChatSeq(false)) return { ok: false, stale: true };
    const cur = store.get().chat?.messages || [];
    store.set({
      chat: {
        messages: [
          ...cur,
          {
            id: `a-${reqId}`,
            role: 'assistant',
            text: res.reply,
            status: 'sent',
            isFallback: Boolean(res.fallback)
          }
        ],
        status: 'idle',
        error: null
      }
    });
    return { ok: true };
  } catch (err) {
    if (reqId !== getChatSeq(false)) return { ok: false, stale: true };
    const cur = store.get().chat?.messages || [];
    store.set({
      chat: {
        messages: cur,
        status: 'error',
        error: { message: formatChatError(err), retryText: text }
      }
    });
    return { ok: false };
  }
}

/**
 * Creates the application controller with injectable store and API dependencies.
 * @param {{ store?: typeof defaultStore, api?: typeof defaultApi }} [deps={}]
 * @returns {object}
 */
export function createController({ store = defaultStore, api = defaultApi } = {}) {
  let latestAdviceRequestId = 0;
  let latestChatRequestId = 0;
  const getAdviceSeq = (inc) => (inc ? ++latestAdviceRequestId : latestAdviceRequestId);
  const getChatSeq = (inc) => (inc ? ++latestChatRequestId : latestChatRequestId);

  const loadLiveAirData = ({ bypassCache = false } = {}) =>
    runAirAndAdvice({ store, api, getAdviceSeq, bypassCache });
  const sendChatMessage = (rawText) => runChatSend({ store, api, rawText, getChatSeq });

  return {
    init: () => {
      store.set({
        view: readSavedView(),
        isOffline: typeof navigator !== 'undefined' ? navigator.onLine === false : false
      });
      const cleanup = attachLifecycleListeners(store, () => loadLiveAirData({ bypassCache: true }));
      if (store.get().profile) loadLiveAirData({ bypassCache: false });
      return cleanup;
    },
    validateDraft: (raw) => validateProfile(raw),
    submitProfile: (rawProfile, { quickStart = false } = {}) => {
      const result = validateProfile(
        quickStart ? createDefaultProfile({ location: rawProfile?.location }) : rawProfile
      );
      if (!result.valid) return { valid: false, errors: result.errors };
      latestChatRequestId += 1;
      store.set({ profile: result.value, isEditingProfile: false });
      loadLiveAirData({ bypassCache: false });
      return { valid: true, errors: [] };
    },
    startEditProfile: () => store.set({ isEditingProfile: true }),
    cancelEditProfile: () => store.get().profile && store.set({ isEditingProfile: false }),
    refreshAirData: () => loadLiveAirData({ bypassCache: true }),
    setView: (tabId) => {
      if (!NAV_TABS.some((t) => t.id === tabId)) return;
      try {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, tabId);
      } catch {
        /* ignore */
      }
      store.set({ view: tabId });
    },
    searchLocations: (q) => api.searchCity(q),
    loadLiveAirData,
    sendChatMessage,
    retryLastChat: () => {
      const retryText = store.get().chat?.error?.retryText;
      return retryText ? sendChatMessage(retryText) : Promise.resolve({ ok: false });
    },
    clearChat: () => {
      latestChatRequestId += 1;
      store.set({ chat: { messages: [], status: 'idle', error: null } });
    }
  };
}

export const controller = createController();
