/**
 * App Shell - Desktop & Mobile Navigation Tabs with Roving Tabindex Keyboard Support
 */
import { NAV_TABS } from '../../config.js';
import i18n from '../../i18n/en.js';
import { h } from '../dom.js';
import { icon } from '../icons.js';

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
 * Builds desktop and mobile navigation landmarks.
 * @param {{ onSelectTab: (tabId: string) => void }} props
 * @returns {{ desktopNav: HTMLElement, mobileNav: HTMLElement, syncNav: (opts: { activeTab: string, hidden: boolean }) => void }}
 */
export function createNavigation({ onSelectTab }) {
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
        onClick: () => onSelectTab(t.id)
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
        onClick: () => onSelectTab(t.id)
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

  wireTabKeyboard(desktopTabs, onSelectTab);
  wireTabKeyboard(mobileTabs, onSelectTab);

  const syncNav = ({ activeTab, hidden }) => {
    desktopNav.hidden = hidden;
    mobileNav.hidden = hidden;
    document.querySelectorAll('[role="tab"]').forEach((t) => {
      const match = t.getAttribute('data-tab-id') === activeTab;
      t.setAttribute('aria-selected', match ? 'true' : 'false');
      t.setAttribute('tabindex', match ? '0' : '-1');
    });
  };

  return { desktopNav, mobileNav, syncNav };
}
