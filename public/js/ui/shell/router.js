/**
 * App Shell - View Router
 * Dispatches pre-selected view models to the appropriate UI view renderer.
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
 * Creates a stateful view router bound to the tabpanel element, selectors, and callbacks.
 * @param {{ panel: HTMLElement, selectors: Record<string, (s: any) => any>, actions: Record<string, any> }} opts
 * @returns {(state: any) => void}
 */
export function createViewRouter({ panel, selectors, actions }) {
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
    const shouldFocus = lastView !== null && lastView !== activeTab;
    lastView = activeTab;

    if (activeTab === 'plan') {
      renderPlanView(panel, { vm: selectors.selectPlanViewModel(state) });
      if (shouldFocus) manageFocus('#plan-heading');
    } else if (activeTab === 'indoor') {
      renderIndoorView(panel, { vm: selectors.selectIndoorViewModel(state) });
      if (shouldFocus) manageFocus('#indoor-heading');
    } else if (activeTab === 'swaps') {
      renderSwapsView(panel, { vm: selectors.selectSwapsViewModel(state) });
      if (shouldFocus) manageFocus('#swaps-heading');
    } else if (activeTab === 'ask') {
      renderChat(panel);
      if (shouldFocus) manageFocus('#chat-heading');
    } else if (activeTab === 'impact') {
      renderImpact(panel);
      if (shouldFocus) manageFocus('#impact-heading');
    } else {
      renderTodayView(panel, {
        vm: selectors.selectTodayViewModel(state),
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
