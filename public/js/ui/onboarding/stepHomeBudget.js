/**
 * Onboarding - Step 4: Home Setup, Budget Segmented Control & Outdoor Exercise
 */
import { h } from '../dom.js';
import i18n from '../../i18n/en.js';
import { createCheckboxRow } from './stepHousehold.js';
import { createRadioCardGroup } from './stepLifestyle.js';

/**
 * Renders Step 4: Home setup, budget segmented control, and outdoor exercise.
 * @param {Record<string, any>} draft
 * @param {() => void} rerender
 * @returns {HTMLElement}
 */
export function renderHomeBudgetStep(draft, rerender) {
  const s = i18n.onboarding.steps;
  const opts = i18n.onboarding.options;

  const homeTypes = [
    { value: 'apartment', label: opts.homeType.apartment, iconName: 'home' },
    { value: 'house', label: opts.homeType.house, iconName: 'home' }
  ];

  const budgets = [
    { value: 'low', label: opts.budget.low },
    { value: 'medium', label: opts.budget.medium },
    { value: 'high', label: opts.budget.high }
  ];

  return h(
    'div',
    { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' } },
    h('h3', { id: 'wizard-step-heading', tabindex: '-1' }, s.homeTitle),
    h(
      'p',
      { style: { color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' } },
      s.homeSubtitle
    ),
    createRadioCardGroup('home-type', s.homeTypeLegend, homeTypes, draft.home.type, (v) => {
      draft.home.type = v;
    }),
    h(
      'div',
      { className: 'form-group' },
      h('span', { className: 'form-label', id: 'budget-label' }, s.budgetLegend),
      h(
        'div',
        { className: 'segmented-control', role: 'radiogroup', 'aria-labelledby': 'budget-label' },
        ...budgets.map((b) =>
          h(
            'button',
            {
              type: 'button',
              role: 'radio',
              className: `segment-btn ${draft.budget === b.value ? 'active' : ''}`,
              'aria-checked': draft.budget === b.value ? 'true' : 'false',
              onClick: () => {
                draft.budget = b.value;
                rerender();
              }
            },
            b.label
          )
        )
      )
    ),
    createCheckboxRow('home-sealed', s.windowsSealedLabel, draft.home.windowsSealed, (v) => {
      draft.home.windowsSealed = v;
    }),
    createCheckboxRow('home-purifier', s.hasPurifierLabel, draft.home.hasPurifier, (v) => {
      draft.home.hasPurifier = v;
    }),
    createCheckboxRow('exercise-outdoors', s.exerciseOutdoorsLabel, draft.exerciseOutdoors, (v) => {
      draft.exerciseOutdoors = v;
    })
  );
}
