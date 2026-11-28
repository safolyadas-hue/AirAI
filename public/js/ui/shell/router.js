/**
 * App Shell - View Router
 * Dispatches active state to the appropriate UI view renderer.
 */
import i18n from '../../i18n/en.js';
import { manageFocus } from '../a11y.js';
import { showToast } from '../toast.js';
import { renderTodayView } from '../today/index.js';
import { renderPlanView } from '../plan.js';
import { renderIndoorView } from '../indoor.js';
import { renderSwapsView } from '../swaps.js';
import { renderChat } from '../chat.js';
import { renderImpact } from '../impact.js';
import { renderOnboarding } from '../onboarding/index.js';

/**
 * Creates a stateful view router bound to the tabpanel element and callbacks.
 * @param {{ panel: HTMLElement, actions: { searchLocations: (q: string) => Promise<any[]>, validateDraft: (raw: any) => any, submitProfile: (raw: any, opts?: any) => any, cancelEditProfile: () => void, refreshAirData: () => void } }} opts
 * @returns {(state: any) => void}
 */
export function createViewRouter({ panel, actions }) {
  let lastView = null;
  let wasOnboarding = null;

  return function renderRoute(state) {
    const showOnboarding = !state.profile || state.isEditingProfile;
    if (showOnboarding) {
      if (wasOnboarding !== true) {
        renderOnboarding(panel, {
          initialProfile: state.profile,
          canCancel: Boolean(state.profile),
          onSearchCity: actions.searchLocations,
          onValidate: actions.validateDraft,
          onSubmit: (raw, opts) => {
            const res = actions.submitProfile(raw, opts);
            if (res.valid) showToast(i18n.toast.profileSaved, { type: 'info', duration: 2500 });
            return res;
          },
          onCancel: actions.cancelEditProfile
        });
      }
      wasOnboarding = true;
      return;
    }
    wasOnboarding = false;

    const activeTab = state.view || 'today';
    panel.id = `panel-${activeTab}`;
    panel.setAttribute('aria-labelledby', `tab-${activeTab}`);

    const catTheme = document.documentElement.getAttribute('data-aqi') || 'unhealthy';
    const catLabel = i18n.aqiCategories[catTheme] || 'Unhealthy';
    const shouldFocus = lastView !== null && lastView !== activeTab;
    lastView = activeTab;

    if (activeTab === 'plan') {
      renderPlanView(panel, {
        rules: state.rules,
        advice: state.advice,
        adviceStatus: state.adviceStatus
      });
      if (shouldFocus) manageFocus('#plan-heading');
    } else if (activeTab === 'indoor') {
      renderIndoorView(panel, {
        rules: state.rules,
        advice: state.advice,
        adviceStatus: state.adviceStatus
      });
      if (shouldFocus) manageFocus('#indoor-heading');
    } else if (activeTab === 'swaps') {
      renderSwapsView(panel, {
        rules: state.rules,
        advice: state.advice,
        adviceStatus: state.adviceStatus
      });
      if (shouldFocus) manageFocus('#swaps-heading');
    } else if (activeTab === 'ask') {
      renderChat(panel);
      if (shouldFocus) manageFocus('#chat-heading');
    } else if (activeTab === 'impact') {
      renderImpact(panel);
      if (shouldFocus) manageFocus('#impact-heading');
    } else {
      renderTodayView(panel, {
        status: state.status,
        air: state.air,
        hourly: state.hourly,
        rules: state.rules,
        advice: state.advice,
        adviceStatus: state.adviceStatus,
        categoryKey: catTheme,
        categoryLabel: catLabel,
        lastUpdatedAt: state.lastUpdatedAt,
        onRefresh: () => {
          actions.refreshAirData();
          showToast(i18n.toast.airRefreshed, { type: 'info', duration: 2000 });
        },
        onRetry: () => actions.refreshAirData()
      });
      if (shouldFocus) manageFocus('#timeline-heading');
    }
  };
}
