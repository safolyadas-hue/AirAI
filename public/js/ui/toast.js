/**
 * Accessible Toast Notification System
 * Uses polite aria-live regions and safe DOM builders.
 */
import { h, mount } from './dom.js';
import { announce } from './a11y.js';

let toastContainer = null;

/**
 * Returns or creates the persistent toast notification container.
 * @returns {HTMLElement}
 */
function getToastContainer() {
  if (!toastContainer || !document.body.contains(toastContainer)) {
    toastContainer = h('div', {
      className: 'toast-container',
      role: 'status',
      'aria-live': 'polite',
      'aria-atomic': 'true'
    });
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

/**
 * Displays an accessible toast notification.
 * @param {string} message - Message text to display and announce.
 * @param {Object} [options={}] - Options.
 * @param {'info' | 'success' | 'error' | 'warning'} [options.type='info'] - Severity tier.
 * @param {number} [options.duration=4000] - Duration in milliseconds before dismissal.
 */
export function showToast(message, { type = 'info', duration = 4000 } = {}) {
  if (!message) return;

  // Screen reader announcement
  announce(message);

  const container = getToastContainer();
  const toast = h(
    'div',
    {
      className: `toast toast-${type}`,
      tabindex: '0'
    },
    message
  );

  mount(container, toast);

  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, duration);
}
