/**
 * CleanAir Companion Application Entry Point
 * Orchestrates domain logic, services, store, and UI modules.
 */
import { getState, subscribe, setState } from './state/store.js';
import { fetchAirQuality } from './services/api.js';
import { renderDashboard } from './ui/dashboard.js';
import { renderOnboarding } from './ui/onboarding.js';
import { renderChat } from './ui/chat.js';
import { renderImpact } from './ui/impact.js';
import { showToast } from './ui/toast.js';
import i18n from './i18n/en.js';

/**
 * Initializes the application.
 */
export async function initApp() {
  const root = document.getElementById('app-root');
  if (!root) return;

  const dashboardContainer = document.createElement('div');
  const onboardingContainer = document.createElement('div');
  const chatContainer = document.createElement('div');
  const impactContainer = document.createElement('div');

  root.appendChild(dashboardContainer);
  root.appendChild(onboardingContainer);
  root.appendChild(chatContainer);
  root.appendChild(impactContainer);

  // Re-render UI on state updates
  subscribe((state) => {
    renderDashboard(dashboardContainer, {
      aqi: state.currentAqi,
      pm25: state.currentPm25,
      hourly: state.hourlyForecast
    });

    renderOnboarding(onboardingContainer, state.profile, (updatedProfile) => {
      setState({ profile: updatedProfile });
      showToast(i18n.toast.preferencesSaved, 'success');
      loadAirData(updatedProfile.location);
    });

    renderChat(chatContainer, state.chatHistory, (msgText) => {
      handleUserChatMessage(msgText);
    });

    renderImpact(impactContainer, {
      co2SavedKg: state.co2SavedKg,
      indoorReduction: state.profile.hasAirPurifier ? 85 : 30
    });
  });

  // Initial render
  const initial = getState();
  renderDashboard(dashboardContainer, { aqi: initial.currentAqi, pm25: initial.currentPm25 });
  renderOnboarding(onboardingContainer, initial.profile, (updated) => {
    setState({ profile: updated });
  });

  if (initial.profile.location) {
    await loadAirData(initial.profile.location);
  }
}

/**
 * Loads air quality information for a target location.
 * @param {string} location
 */
async function loadAirData(location) {
  if (!location) return;
  try {
    const data = await fetchAirQuality(location);
    setState({
      currentAqi: data.aqi,
      currentPm25: data.pm25,
      hourlyForecast: data.hourly || []
    });
    showToast(i18n.toast.aqiUpdated, 'info');
  } catch {
    showToast(i18n.toast.errorGeneric, 'error');
  }
}

/**
 * Handles outgoing user chat message.
 * @param {string} text
 */
function handleUserChatMessage(text) {
  const current = getState();
  const nextHistory = [...current.chatHistory, { sender: /** @type {'user'} */ ('user'), text }];
  setState({ chatHistory: nextHistory });
}

// Auto-boot when document is ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initApp();
  });
}
