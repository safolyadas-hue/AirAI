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
import { renderChat } from '../chat/index.js';
import { renderImpact } from '../impact/index.js';
import { renderOnboarding } from '../onboarding/index.js';

function dispatchTabView(activeTab, panel, state, selectors, actions) {
  if (activeTab === 'plan') {
    renderPlanView(panel, { vm: selectors.selectPlanViewModel(state) });
    return '#plan-heading';
  }
  if (activeTab === 'indoor') {
    renderIndoorView(panel, { vm: selectors.selectIndoorViewModel(state) });
    return '#indoor-heading';
  }
  if (activeTab === 'swaps') {
    renderSwapsView(panel, { vm: selectors.selectSwapsViewModel(state) });
    return '#swaps-heading';
  }
  if (activeTab === 'ask') {
    renderChat(panel, {
      vm: selectors.selectChatViewModel(state),
      onSend: (text) => actions.sendChatMessage(text),
      onRetry: () => actions.retryLastChat(),
      onClear: () => actions.clearChat()
    });
    return '#chat-heading';
  }
  if (activeTab === 'impact') {
    renderImpact(panel, {
      selectModel: (selectedIds) => selectors.selectImpactViewModel(state, selectedIds)
    });
    return '#impact-heading';
  }
  renderTodayView(panel, {
    vm: selectors.selectTodayViewModel(state),
    onRefresh: () => {
      actions.refreshAirData();
      showToast(i18n.toast.airRefreshed, { type: 'info', duration: 2000 });
    },
    onRetry: () => actions.refreshAirData()
  });
  return '#timeline-heading';
}

/**
 * Creates a stateful view router bound to the tabpanel element, selectors, and callbacks.
 * @param {{ panel: HTMLElement, selectors: Record<string, any>, actions: Record<string, any> }} opts
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

    const headingSel = dispatchTabView(activeTab, panel, state, selectors, actions);
    if (shouldFocus) manageFocus(headingSel);
  };
}
