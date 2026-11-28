/**
 * Today View - Priority Protective Actions Grid
 */
import { h } from '../dom.js';
import { icon } from '../icons.js';
import i18n from '../../i18n/en.js';

/**
 * Builds the top-3 priority actions section.
 * @param {Array<object>} actions
 * @returns {HTMLElement}
 */
export function createActionsSection(actions = []) {
  const topActions = actions.slice(0, 3);
  const actionCards = topActions.map((act) =>
    h(
      'div',
      { className: 'card card-interactive col-span-4' },
      h(
        'div',
        {
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-2)',
            gap: 'var(--space-2)',
            flexWrap: 'wrap'
          }
        },
        h('span', { className: 'badge chip-accent' }, act.category),
        h(
          'span',
          {
            className: `badge ${act.effort === 'low' ? 'badge-effort-low' : 'badge-effort-medium'}`
          },
          `${act.effort} effort`
        )
      ),
      h(
        'h3',
        { style: { fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-2)' } },
        act.title
      ),
      h(
        'p',
        { style: { fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' } },
        act.why
      ),
      h(
        'details',
        { className: 'why-disclosure' },
        h('summary', {}, icon('info', { size: 14 }), i18n.components.whyThis),
        h('div', { className: 'disclosure-body' }, act.why)
      )
    )
  );

  return h(
    'section',
    {
      className: 'col-span-12',
      'aria-labelledby': 'priority-actions-heading',
      style: { marginTop: 'var(--space-2)' }
    },
    h(
      'h2',
      { id: 'priority-actions-heading', style: { marginBottom: 'var(--space-4)' } },
      i18n.today.recommendedActionsTitle
    ),
    h('div', { className: 'bento-grid' }, ...actionCards)
  );
}
