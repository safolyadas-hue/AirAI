/**
 * Accessibility (a11y) Helpers
 * Manages live-region announcements and focus states.
 */

/**
 * Announces a message to screen readers via the aria-live polite region.
 * @param {string} message - Text announcement.
 */
export function announceToScreenReader(message) {
  const container = document.getElementById('a11y-announcements');
  if (container) {
    container.textContent = message;
  }
}

/**
 * Sets focus safely to an element after DOM updates.
 * @param {string | HTMLElement} target
 */
export function setFocus(target) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (el && typeof el.focus === 'function') {
    el.focus();
  }
}
