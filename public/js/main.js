/**
 * CleanAir Companion - Application Entry Point
 * Thin bootstrap wiring store, controller, and shell UI modules.
 */
import { NAV_TABS } from './config.js';
import i18n from './i18n/en.js';
import { h, mount } from './ui/dom.js';
import {
  initSkipLink,
  getSavedTheme,
  getSavedFontSize,
  applyTheme,
  applyFontSize,
  announce
} from './ui/a11y.js';
import { store } from './state/store.js';
import { controller } from './app/controller.js';
import * as selectors from './app/selectors.js';
import { createHeader } from './ui/shell/header.js';
import { createNavigation } from './ui/shell/nav.js';
import { createOfflineBanner, createFooter } from './ui/shell/banners.js';
import { createViewRouter } from './ui/shell/router.js';

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

  const header = createHeader({ onEditProfile: () => controller.startEditProfile() });
  const offlineBanner = createOfflineBanner();
  const nav = createNavigation({
    onSelectTab: (tabId) => {
      controller.setView(tabId);
      const tabObj = NAV_TABS.find((t) => t.id === tabId);
      announce(`${i18n.toast.viewChanged} ${tabObj ? i18n.nav[tabObj.id] : tabId}`);
    }
  });

  const panel = h('section', {
    id: 'panel-today',
    role: 'tabpanel',
    'aria-labelledby': 'tab-today',
    tabindex: '0'
  });
  const mainContent = h('main', { id: 'main-content', className: 'app-main container' }, panel);
  const footer = createFooter();

  root.textContent = '';
  mount(root, header.el, offlineBanner, nav.desktopNav, mainContent, nav.mobileNav, footer);

  const renderRoute = createViewRouter({ panel, selectors, actions: controller });

  const renderFromState = (state) => {
    const showOnboarding = !state.profile || state.isEditingProfile;
    offlineBanner.hidden = !state.isOffline;
    header.syncHeader({ profile: state.profile, showOnboarding });
    nav.syncNav({ activeTab: state.view || 'today', hidden: showOnboarding });
    renderRoute(state);
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
