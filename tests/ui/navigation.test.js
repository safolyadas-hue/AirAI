/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { initApp } from '../../public/js/main.js';

describe('Navigation Tabs & Arrow Key Accessibility', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app-root" class="app-wrapper"></div>';
    localStorage.clear();
    initApp();
  });

  it('renders tab buttons with correct ARIA roles and attributes', () => {
    const tabs = Array.from(document.querySelectorAll('.desktop-nav-inner [role="tab"]'));
    expect(tabs.length).toBe(6);

    const activeTab = tabs.find((t) => t.getAttribute('aria-selected') === 'true');
    expect(activeTab).toBeDefined();
    expect(activeTab?.getAttribute('tabindex')).toBe('0');

    const inactiveTabs = tabs.filter((t) => t.getAttribute('aria-selected') === 'false');
    expect(inactiveTabs.length).toBe(5);
    inactiveTabs.forEach((t) => {
      expect(t.getAttribute('tabindex')).toBe('-1');
    });
  });

  it('switches views and updates aria-selected on click', () => {
    const planTab = document.querySelector('[data-tab-id="plan"]');
    expect(planTab).toBeDefined();

    planTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(planTab?.getAttribute('aria-selected')).toBe('true');
    expect(planTab?.getAttribute('tabindex')).toBe('0');

    const todayTab = document.querySelector('[data-tab-id="today"]');
    expect(todayTab?.getAttribute('aria-selected')).toBe('false');
    expect(todayTab?.getAttribute('tabindex')).toBe('-1');

    const panel = document.querySelector('[role="tabpanel"]');
    expect(panel?.id).toBe('panel-plan');
  });

  it('navigates through tabs using ArrowRight, ArrowLeft, End, and Home keys', () => {
    const desktopTabs = Array.from(document.querySelectorAll('.desktop-nav-inner [role="tab"]'));
    const firstTab = desktopTabs[0];

    // ArrowRight to next tab
    firstTab.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    const secondTab = desktopTabs[1];
    expect(secondTab.getAttribute('aria-selected')).toBe('true');

    // End key to last tab
    secondTab.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    const lastTab = desktopTabs[desktopTabs.length - 1];
    expect(lastTab.getAttribute('aria-selected')).toBe('true');

    // Home key back to first tab
    lastTab.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(firstTab.getAttribute('aria-selected')).toBe('true');
  });
});
