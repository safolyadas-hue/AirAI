/**
 * CleanAir Companion - Application Shell
 * Thin UI shell subscribing to the store and delegating orchestration to controller.js.
 */
import { NAV_TABS } from './config.js';
import i18n from './i18n/en.js';
import { h, mount } from './ui/dom.js';
import { icon } from './ui/icons.js';
import {
  initSkipLink,
  cycleTheme,
  cycleFontSize,
  getSavedTheme,
  getSavedFontSize,
  applyTheme,
  applyFontSize,
  manageFocus,
  announce
} from './ui/a11y.js';
import { showToast } from './ui/toast.js';
import { store } from './state/store.js';
import { controller } from './app/controller.js';
import { renderTodayView } from './ui/dashboard.js';
import { renderPlanView } from './ui/plan.js';
import { renderIndoorView } from './ui/indoor.js';
import { renderSwapsView } from './ui/swaps.js';
import { renderChat } from './ui/chat.js';
import { renderImpact } from './ui/impact.js';
import { renderOnboarding } from './ui/onboarding.js';

/**
 * Wires ARIA keyboard roving tabindex and arrow navigation across tabs.
 * @param {HTMLElement[]} tabElements
 * @param {(tabId: string) => void} onSelectTab
 */
function wireTabKeyboard(tabElements, onSelectTab) {
  tabElements.forEach((tab, index) => {
    tab.addEventListener('keydown', (e) => {
      let nextIndex = index;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextIndex = (index + 1) % tabElements.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        nextIndex = (index - 1 + tabElements.length) % tabElements.length;
      } else if (e.key === 'Home') {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        nextIndex = tabElements.length - 1;
      }

      if (nextIndex !== index) {
        const nextTab = tabElements[nextIndex];
        const nextId = nextTab.getAttribute('data-tab-id') || 'today';
        onSelectTab(nextId);
        nextTab.focus();
      }
    });
  });
}

/**
 * Initializes the CleanAir Companion Application Shell.
 */
export function initApp() {
  const root = document.getElementById('app-root');
  if (!root) return;
  root.classList.add('app-wrapper');

  applyTheme(getSavedTheme());
  applyFontSize(getSavedFontSize());
  initSkipLink();

  const locationText = h('span', { className: 'header-location-text' }, '');
  const locationChip = h(
    'span',
    { className: 'chip header-location', title: i18n.header.locationLabel, hidden: true },
    icon('location', { size: 14 }),
    locationText
  );

  const editProfileBtn = h(
    'button',
    {
      type: 'button',
      className: 'btn btn-secondary',
      hidden: true,
      onClick: () => controller.startEditProfile()
    },
    i18n.header.editProfile
  );

  const themeBtn = h(
    'button',
    {
      className: 'btn btn-icon btn-ghost',
      'aria-label': i18n.header.themeLabel,
      title: i18n.header.themeLabel,
      onClick: () => {
        const next = cycleTheme();
        showToast(`${i18n.toast.themeUpdated} (${next})`, { type: 'info', duration: 2500 });
      }
    },
    icon('sun', { size: 20 })
  );

  const fontBtn = h(
    'button',
    {
      className: 'btn btn-icon btn-ghost',
      'aria-label': i18n.header.fontSizeLabel,
      title: i18n.header.fontSizeLabel,
      onClick: () => {
        const next = cycleFontSize();
        showToast(`${i18n.toast.fontSizeUpdated} (${next})`, { type: 'info', duration: 2500 });
      }
    },
    h('span', { style: { fontWeight: '700', fontSize: '0.9rem' } }, 'A±')
  );

  const header = h(
    'header',
    { className: 'app-header', role: 'banner' },
    h(
      'div',
      { className: 'header-container container' },
      h(
        'div',
        { className: 'brand-group' },
        icon('leaf', { size: 32, className: 'brand-logo' }),
        h(
          'div',
          { className: 'brand-text-wrap' },
          h('h1', { className: 'brand-title' }, i18n.app.title)
        )
      ),
      locationChip,
      h('div', { className: 'header-actions' }, editProfileBtn, fontBtn, themeBtn)
    )
  );

  const offlineBanner = h(
    'div',
    { className: 'offline-banner', role: 'status', 'aria-live': 'polite', hidden: true },
    h('div', { className: 'container' }, i18n.status.offlineBanner)
  );

  const switchTab = (tabId) => {
    controller.setView(tabId);
    const tabObj = NAV_TABS.find((t) => t.id === tabId);
    announce(`${i18n.toast.viewChanged} ${tabObj ? i18n.nav[tabObj.id] : tabId}`);
  };

  const desktopTabs = NAV_TABS.map((t) =>
    h(
      'button',
      {
        role: 'tab',
        id: `tab-desktop-${t.id}`,
        'aria-controls': `panel-${t.id}`,
        'aria-selected': 'false',
        tabindex: '-1',
        dataset: { tabId: t.id },
        className: 'nav-tab-btn',
        onClick: () => switchTab(t.id)
      },
      icon(t.icon, { size: 16 }),
      i18n.nav[t.id]
    )
  );

  const desktopNav = h(
    'nav',
    { className: 'desktop-nav', 'aria-label': i18n.nav.label },
    h('div', { className: 'desktop-nav-inner container', role: 'tablist' }, ...desktopTabs)
  );

  const mobileTabs = NAV_TABS.map((t) =>
    h(
      'button',
      {
        role: 'tab',
        id: `tab-mobile-${t.id}`,
        'aria-controls': `panel-${t.id}`,
        'aria-selected': 'false',
        tabindex: '-1',
        dataset: { tabId: t.id },
        className: 'mobile-tab-btn',
        onClick: () => switchTab(t.id)
      },
      icon(t.icon, { size: 20 }),
      h('span', {}, i18n.nav[`${t.id}Short`] || i18n.nav[t.id])
    )
  );

  const mobileNav = h(
    'nav',
    { className: 'mobile-nav', 'aria-label': `${i18n.nav.label} Mobile`, role: 'tablist' },
    ...mobileTabs
  );

  wireTabKeyboard(desktopTabs, switchTab);
  wireTabKeyboard(mobileTabs, switchTab);

  const panel = h('section', {
    id: 'panel-today',
    role: 'tabpanel',
    'aria-labelledby': 'tab-today',
    tabindex: '0'
  });
  const mainContent = h('main', { id: 'main-content', className: 'app-main container' }, panel);

  const footer = h(
    'footer',
    { className: 'app-footer', role: 'contentinfo' },
    h(
      'div',
      { className: 'footer-inner container' },
      h(
        'div',
        {},
        h(
          'p',
          { style: { fontWeight: '600', marginBottom: 'var(--space-1)' } },
          i18n.footer.attribution
        ),
        h('p', { style: { maxWidth: '65ch', margin: '0 auto' } }, i18n.footer.medicalDisclaimer)
      ),
      h(
        'a',
        {
          href: 'https://github.com/safolyadas-hue/AirAI',
          target: '_blank',
          rel: 'noopener noreferrer',
          className: 'btn btn-secondary',
          style: { minHeight: '36px', fontSize: 'var(--font-size-xs)' }
        },
        icon('info', { size: 14 }),
        i18n.footer.repoLink
      )
    )
  );

  root.textContent = '';
  mount(root, header, offlineBanner, desktopNav, mainContent, mobileNav, footer);

  let lastView = null;
  let wasOnboarding = null;

  const renderFromState = (state) => {
    offlineBanner.hidden = !state.isOffline;

    const showOnboarding = !state.profile || state.isEditingProfile;
    desktopNav.hidden = showOnboarding;
    mobileNav.hidden = showOnboarding;
    locationChip.hidden = !state.profile;
    editProfileBtn.hidden = showOnboarding || !state.profile;

    if (state.profile) {
      locationText.textContent = state.profile.location.name;
    }

    if (showOnboarding) {
      if (wasOnboarding !== true) {
        renderOnboarding(panel, {
          initialProfile: state.profile,
          canCancel: Boolean(state.profile),
          onSearchCity: (q) => controller.searchLocations(q),
          onSubmit: (raw, opts) => {
            const res = controller.submitProfile(raw, opts);
            if (res.valid) showToast(i18n.toast.profileSaved, { type: 'info', duration: 2500 });
            return res;
          },
          onCancel: () => controller.cancelEditProfile()
        });
      }
      wasOnboarding = true;
      return;
    }
    wasOnboarding = false;

    const activeTab = state.view || 'today';
    panel.id = `panel-${activeTab}`;
    panel.setAttribute('aria-labelledby', `tab-${activeTab}`);

    document.querySelectorAll('[role="tab"]').forEach((t) => {
      const match = t.getAttribute('data-tab-id') === activeTab;
      t.setAttribute('aria-selected', match ? 'true' : 'false');
      t.setAttribute('tabindex', match ? '0' : '-1');
    });

    const catTheme = document.documentElement.getAttribute('data-aqi') || 'unhealthy';
    const catLabel = i18n.aqiCategories[catTheme] || 'Unhealthy';

    const shouldFocus = lastView !== null && lastView !== activeTab;
    lastView = activeTab;

    switch (activeTab) {
      case 'plan':
        renderPlanView(panel, {
          rules: state.rules,
          advice: state.advice,
          adviceStatus: state.adviceStatus
        });
        if (shouldFocus) manageFocus('#plan-heading');
        break;
      case 'indoor':
        renderIndoorView(panel, {
          rules: state.rules,
          advice: state.advice,
          adviceStatus: state.adviceStatus
        });
        if (shouldFocus) manageFocus('#indoor-heading');
        break;
      case 'swaps':
        renderSwapsView(panel, {
          rules: state.rules,
          advice: state.advice,
          adviceStatus: state.adviceStatus
        });
        if (shouldFocus) manageFocus('#swaps-heading');
        break;
      case 'ask':
        renderChat(panel);
        if (shouldFocus) manageFocus('#chat-heading');
        break;
      case 'impact':
        renderImpact(panel);
        if (shouldFocus) manageFocus('#impact-heading');
        break;
      case 'today':
      default:
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
            controller.refreshAirData();
            showToast(i18n.toast.airRefreshed, { type: 'info', duration: 2000 });
          },
          onRetry: () => controller.refreshAirData()
        });
        if (shouldFocus) manageFocus('#timeline-heading');
        break;
    }
  };

  store.subscribe(renderFromState);
  controller.init();
  renderFromState(store.get());
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
}
