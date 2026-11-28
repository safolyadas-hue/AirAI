/**
 * Impact What-If - Estimates & Assumptions Disclosure
 */
import { h } from '../dom.js';
import { icon } from '../icons.js';
import i18n from '../../i18n/en.js';

/**
 * Builds the assumptions disclosure listing every selected action's assumption and source benchmarks.
 * @param {string[]} assumptions
 * @returns {HTMLElement}
 */
export function createAssumptionsCard(assumptions = []) {
  return h(
    'details',
    { className: 'why-disclosure col-span-12' },
    h('summary', {}, icon('info', { size: 14 }), i18n.impact.assumptionsTitle),
    h(
      'div',
      { className: 'disclosure-body' },
      h(
        'p',
        { style: { marginBottom: 'var(--space-2)', fontWeight: '600' } },
        i18n.impact.assumptionsNote
      ),
      h(
        'ul',
        { style: { paddingLeft: '1.25rem' } },
        ...assumptions.map((text) => h('li', { style: { marginBottom: 'var(--space-1)' } }, text))
      )
    )
  );
}
