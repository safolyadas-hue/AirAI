/**
 * Accessible Toast Notifications
 * DOM rendering only.
 */
import { createElement } from './dom.js';
import { announceToScreenReader } from './a11y.js';

/**
 * Displays a temporary toast message and announces it to assistive technologies.
 * @param {string} message - Message text.
 * @param {'info' | 'success' | 'error'} [type='info'] - Severity level.
 * @param {number} [durationMs=4000] - Display duration.
 */
export function showToast(message, type = 'info', durationMs = 4000) {
  announceToScreenReader(message);

  let container = document.getElementById('toast-container');
  if (!container) {
    container = createElement('div', {
      attributes: { id: 'toast-container', role: 'status', 'aria-live': 'polite' },
      classes: ['toast-container']
    });
    document.body.appendChild(container);
  }

  const toast = createElement('div', {
    classes: ['toast', `toast-${type}`],
    text: message
  });

  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, durationMs);
}
