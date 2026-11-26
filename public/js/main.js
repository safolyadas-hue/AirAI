/**
 * CleanAir Companion - Application Shell & Controller
 * Orchestrates navigation, demo mode switching, themes, and views without network calls.
 */
import { DEMO_MODE, AQI_THEME_MAP, NAV_TABS, STORAGE_KEYS } from './config.js';
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
import { DEMO_DATA_BY_CATEGORY, DEMO_TIMELINE_HOURLY } from './demo/demoData.js';
import { renderTodayView } from './ui/dashboard.js';
import { renderPlanView } from './ui/onboarding.js';
import { renderIndoorView } from './ui/indoor.js';
import { renderSwapsView } from './ui/swaps.js';
import { renderChat } from './ui/chat.js';
import { renderImpact } from './ui/impact.js';

/**
 * Application Shell State
 */
let currentCategoryKey = 'unhealthy';
let currentActiveTab = 'today';

/**
 * Returns saved or default active tab.
 * @returns {string}
 */
function getSavedTab() {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB);
    if (NAV_TABS.some((t) => t.id === val)) return val;
  } catch {
    // Ignore storage read error
  }
  return 'today';
}

/**
 * Sets document `data-aqi` attribute matching the active AQI category.
 * @param {string} catKey
 */
function setAqiTheme(catKey) {
  const token = AQI_THEME_MAP[catKey] || 'unhealthy';
  document.documentElement.setAttribute('data-aqi', token);
}

/**
 * Renders the currently selected view inside the tabpanel container.
 * @param {HTMLElement} panel
 * @param {boolean} [shouldFocus=false]
 */
function renderActiveView(panel, shouldFocus = false) {
  const data = DEMO_DATA_BY_CATEGORY[currentCategoryKey] || DEMO_DATA_BY_CATEGORY.unhealthy;
  const catTheme = AQI_THEME_MAP[currentCategoryKey] || 'unhealthy';
  const catLabel = i18n.aqiCategories[catTheme] || 'Unhealthy';

  switch (currentActiveTab) {
    case 'plan':
      renderPlanView(panel);
      if (shouldFocus) manageFocus('#plan-heading');
      break;
    case 'indoor':
      renderIndoorView(panel);
      if (shouldFocus) manageFocus('#indoor-heading');
      break;
    case 'swaps':
      renderSwapsView(panel);
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
        aqi: data.aqi,
        categoryKey: catTheme,
        categoryLabel: catLabel,
        dominantPollutant: data.dominantPollutant,
        headline: data.headline,
        actions: data.actions,
        hourly: DEMO_TIMELINE_HOURLY
      });
      if (shouldFocus) manageFocus('#timeline-heading');
      break;
  }
}

/**
 * Creates the Header navigation bar with brand, location pill, theme toggle, and font scale.
 * @returns {HTMLElement}
 */
function createHeader() {
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

  return h(
    'header',
    { className: 'app-header', role: 'banner' },
    h(
      'div',
      { className: 'header-container' },
      h(
        'div',
        { className: 'brand-group' },
        icon('leaf', { size: 32, className: 'brand-logo' }),
        h(
          'div',
          { className: 'brand-text-wrap' },
          h('h1', { className: 'brand-title' }, i18n.app.title),
          h('span', { className: 'brand-badge' }, i18n.app.demoBadge)
        )
      ),
      h(
        'div',
        { className: 'header-actions' },
        h(
          'span',
          { className: 'chip', title: i18n.header.locationLabel },
          icon('location', { size: 14 }),
          i18n.header.demoCity
        ),
        fontBtn,
        themeBtn
      )
    )
  );
}

/**
 * Creates the temporary Demo AQI segmented control bar.
 * @param {() => void} onLevelChange
 * @returns {HTMLElement | null}
 */
function createDemoBar(onLevelChange) {
  if (!DEMO_MODE) return null;

  const categories = [
    { key: 'good', label: i18n.demo.good },
    { key: 'moderate', label: i18n.demo.moderate },
    { key: 'usg', label: i18n.demo.usg },
    { key: 'unhealthy', label: i18n.demo.unhealthy },
    { key: 'very_unhealthy', label: i18n.demo.veryUnhealthy },
    { key: 'hazardous', label: i18n.demo.hazardous }
  ];

  const buttons = categories.map((cat) =>
    h(
      'button',
      {
        type: 'button',
        className: `segment-btn ${cat.key === currentCategoryKey ? 'active' : ''}`,
        'aria-checked': cat.key === currentCategoryKey ? 'true' : 'false',
        role: 'radio',
        onClick: () => {
          currentCategoryKey = cat.key;
          setAqiTheme(currentCategoryKey);
          buttons.forEach((b) => {
            b.classList.remove('active');
            b.setAttribute('aria-checked', 'false');
          });
          const activeBtn = buttons.find((_, i) => categories[i].key === cat.key);
          if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.setAttribute('aria-checked', 'true');
          }
          onLevelChange();
          showToast(`${i18n.toast.demoAqiSwitched} ${cat.label}`, { type: 'info', duration: 2000 });
        }
      },
      cat.label
    )
  );

  return h(
    'aside',
    { className: 'demo-control-bar', 'aria-label': i18n.demo.controlLabel },
    h(
      'div',
      { className: 'demo-control-inner' },
      h('span', { className: 'demo-title-tag' }, icon('alert', { size: 14 }), i18n.demo.legend),
      h('div', { className: 'segmented-control', role: 'radiogroup' }, ...buttons)
    )
  );
}

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

  // Sync preferences
  applyTheme(getSavedTheme());
  applyFontSize(getSavedFontSize());
  currentActiveTab = getSavedTab();
  setAqiTheme(currentCategoryKey);
  initSkipLink();

  // Create main tabpanel
  const panel = h('section', {
    id: `panel-${currentActiveTab}`,
    role: 'tabpanel',
    'aria-labelledby': `tab-${currentActiveTab}`,
    tabindex: '0'
  });

  const switchTab = (tabId) => {
    currentActiveTab = tabId;
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, tabId);
    } catch {
      // LocalStorage write handling
    }

    panel.id = `panel-${tabId}`;
    panel.setAttribute('aria-labelledby', `tab-${tabId}`);

    // Update active state in desktop and mobile tabs
    document.querySelectorAll('[role="tab"]').forEach((t) => {
      const match = t.getAttribute('data-tab-id') === tabId;
      t.setAttribute('aria-selected', match ? 'true' : 'false');
      t.setAttribute('tabindex', match ? '0' : '-1');
    });

    renderActiveView(panel, true);
    const tabObj = NAV_TABS.find((t) => t.id === tabId);
    const label = tabObj ? i18n.nav[tabObj.id] : tabId;
    announce(`${i18n.toast.viewChanged} ${label}`);
  };

  // Build Desktop Nav Tabs
  const desktopTabs = NAV_TABS.map((t) =>
    h(
      'button',
      {
        role: 'tab',
        id: `tab-desktop-${t.id}`,
        'aria-controls': `panel-${t.id}`,
        'aria-selected': t.id === currentActiveTab ? 'true' : 'false',
        tabindex: t.id === currentActiveTab ? '0' : '-1',
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
    h('div', { className: 'desktop-nav-inner', role: 'tablist' }, ...desktopTabs)
  );

  // Build Mobile Bottom Nav Tabs
  const mobileTabs = NAV_TABS.map((t) =>
    h(
      'button',
      {
        role: 'tab',
        id: `tab-mobile-${t.id}`,
        'aria-controls': `panel-${t.id}`,
        'aria-selected': t.id === currentActiveTab ? 'true' : 'false',
        tabindex: t.id === currentActiveTab ? '0' : '-1',
        dataset: { tabId: t.id },
        className: 'mobile-tab-btn',
        onClick: () => switchTab(t.id)
      },
      icon(t.icon, { size: 20 }),
      h('span', {}, i18n.nav[t.id])
    )
  );

  const mobileNav = h(
    'nav',
    { className: 'mobile-nav', 'aria-label': `${i18n.nav.label} Mobile`, role: 'tablist' },
    ...mobileTabs
  );

  wireTabKeyboard(desktopTabs, switchTab);
  wireTabKeyboard(mobileTabs, switchTab);

  const header = createHeader();
  const demoBar = createDemoBar(() => renderActiveView(panel, false));

  // Footer Landmark
  const footer = h(
    'footer',
    { className: 'app-footer', role: 'contentinfo' },
    h(
      'div',
      { className: 'footer-inner' },
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

  // Mount shell
  root.textContent = '';
  mount(root, header, demoBar || h('div'), desktopNav, panel, mobileNav, footer);

  // Initial view render
  renderActiveView(panel, false);
}

// Auto-boot when DOM is loaded
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
}
