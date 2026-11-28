/**
 * App Shell - Offline Banner & Footer Landmark
 */
import i18n from '../../i18n/en.js';
import { h } from '../dom.js';
import { icon } from '../icons.js';

/**
 * Builds the offline status banner element.
 * @returns {HTMLElement}
 */
export function createOfflineBanner() {
  return h(
    'div',
    { className: 'offline-banner', role: 'status', 'aria-live': 'polite', hidden: true },
    h('div', { className: 'container' }, i18n.status.offlineBanner)
  );
}

/**
 * Builds the application footer landmark.
 * @returns {HTMLElement}
 */
export function createFooter() {
  return h(
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
}
