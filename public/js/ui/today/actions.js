/**
 * Today View - Priority Protective Actions Grid with Impact Chips
 */
import { h } from '../dom.js';
import { icon } from '../icons.js';
import i18n from '../../i18n/en.js';

/**
 * Builds impact chips from an action's pre-computed impact object.
 * @param {any} impact
 * @returns {HTMLElement[]}
 */
function createImpactChips(impact) {
  if (!impact) return [];
  const chips = [];
  if (impact.pm25ReductionRange) {
    chips.push(
      h(
        'span',
        { className: 'chip chip-accent' },
        `${i18n.plan.estimatedPrefix}: -${impact.pm25ReductionRange.min}–${impact.pm25ReductionRange.max}% PM2.5`
      )
    );
  }
  if (impact.co2KgPerWeek > 0) {
    chips.push(
      h(
        'span',
        { className: 'chip badge-cost-free' },
        `${i18n.plan.estimatedPrefix}: -${impact.co2KgPerWeek} kg CO₂/wk`
      )
    );
  }
  return chips;
}

/**
 * Builds the top-3 priority actions section.
 * @param {Array<object>} actions
 * @returns {HTMLElement}
 */
export function createActionsSection(actions = []) {
  const actionCards = actions.slice(0, 3).map((act) =>
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
        'div',
        {
          style: {
            display: 'flex',
            gap: 'var(--space-2)',
            flexWrap: 'wrap',
            marginTop: 'var(--space-2)'
          }
        },
        ...createImpactChips(act.impact)
      ),
      h(
        'details',
        { className: 'why-disclosure' },
        h('summary', {}, icon('info', { size: 14 }), i18n.components.whyThis),
        h(
          'div',
          { className: 'disclosure-body' },
          act.aiExplanation || act.impact?.assumption || act.why
        )
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
