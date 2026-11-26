/**
 * Accessibility, Focus, Theme & Text Scaling Coordinator
 * Manages polite announcements, view focus transitions, theme persistence, and font scaling.
 */
import { STORAGE_KEYS } from '../config.js';

/**
 * Announces a message to screen readers via polite live region.
 * @param {string} message - Text announcement.
 */
export function announce(message) {
  if (!message || typeof document === 'undefined') return;
  const container = document.getElementById('a11y-announcements');
  if (container) {
    container.textContent = '';
    // Small timeout ensures screen readers re-trigger on repeated text
    setTimeout(() => {
      container.textContent = message;
    }, 50);
  }
}

// Backward compatibility alias
export const announceToScreenReader = announce;

/**
 * Focuses an element smoothly after a view or route transition.
 * @param {string | HTMLElement} target
 */
export function manageFocus(target) {
  if (typeof document === 'undefined') return;
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (el) {
    el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: false });
    el.addEventListener(
      'blur',
      () => {
        el.removeAttribute('tabindex');
      },
      { once: true }
    );
  }
}

// Backward compatibility alias
export const setFocus = manageFocus;

/**
 * Initializes the skip-to-content navigation link.
 */
export function initSkipLink() {
  const skipLink = document.querySelector('.skip-link');
  if (!skipLink) return;

  skipLink.addEventListener('click', (e) => {
    e.preventDefault();
    const main = document.getElementById('main-content');
    if (main) {
      manageFocus(main);
    }
  });
}

/**
 * Reads saved theme preference with safe fallback to 'system'.
 * @returns {'light' | 'dark' | 'system'}
 */
export function getSavedTheme() {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.THEME);
    if (val === 'light' || val === 'dark' || val === 'system') return val;
  } catch {
    // LocalStorage access handling
  }
  return 'system';
}

/**
 * Applies color scheme theme to document root.
 * @param {'light' | 'dark' | 'system'} theme
 */
export function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (theme === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', theme);
  }

  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch {
    // LocalStorage write handling
  }
}

/**
 * Cycles to the next color scheme theme (system -> light -> dark).
 * @returns {'light' | 'dark' | 'system'} Newly activated theme.
 */
export function cycleTheme() {
  const current = getSavedTheme();
  let next = 'light';
  if (current === 'light') next = 'dark';
  else if (current === 'dark') next = 'system';
  else next = 'light';

  applyTheme(next);
  return next;
}

/**
 * Reads saved font size preference ('normal' | 'large' | 'larger').
 * @returns {'normal' | 'large' | 'larger'}
 */
export function getSavedFontSize() {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.FONT_SIZE);
    if (val === 'normal' || val === 'large' || val === 'larger') return val;
  } catch {
    // LocalStorage access handling
  }
  return 'normal';
}

/**
 * Applies root font-size class.
 * @param {'normal' | 'large' | 'larger'} size
 */
export function applyFontSize(size) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('font-large', 'font-larger');

  if (size === 'large') {
    root.classList.add('font-large');
  } else if (size === 'larger') {
    root.classList.add('font-larger');
  }

  try {
    localStorage.setItem(STORAGE_KEYS.FONT_SIZE, size);
  } catch {
    // LocalStorage write handling
  }
}

/**
 * Cycles to next font scale (normal -> large -> larger -> normal).
 * @returns {'normal' | 'large' | 'larger'} Newly activated size.
 */
export function cycleFontSize() {
  const current = getSavedFontSize();
  let next = 'large';
  if (current === 'normal') next = 'large';
  else if (current === 'large') next = 'larger';
  else next = 'normal';

  applyFontSize(next);
  return next;
}
