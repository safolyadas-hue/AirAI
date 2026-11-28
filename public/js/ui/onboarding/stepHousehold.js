/**
 * Onboarding - Step 2: Household Composition & Sensitivity
 */
import { h } from '../dom.js';
import { icon } from '../icons.js';
import i18n from '../../i18n/en.js';

/**
 * Builds an accessible stepper control row.
 * @param {string} id
 * @param {string} label
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @param {(nextVal: number) => void} onChange
 * @returns {HTMLElement}
 */
function createStepper(id, label, value, min, max, onChange) {
  const valSpan = h(
    'span',
    { id: `${id}-value`, className: 'stepper-value tabular-nums', 'aria-live': 'polite' },
    String(value)
  );

  return h(
    'div',
    { className: 'stepper-row' },
    h('span', { className: 'form-label' }, label),
    h(
      'div',
      { className: 'stepper-controls' },
      h(
        'button',
        {
          type: 'button',
          className: 'btn btn-secondary btn-icon',
          'aria-label': `${i18n.onboarding.steps.decrease} ${label}`,
          disabled: value <= min,
          onClick: () => {
            if (value > min) onChange(value - 1);
          }
        },
        '−'
      ),
      valSpan,
      h(
        'button',
        {
          type: 'button',
          className: 'btn btn-secondary btn-icon',
          'aria-label': `${i18n.onboarding.steps.increase} ${label}`,
          disabled: value >= max,
          onClick: () => {
            if (value < max) onChange(value + 1);
          }
        },
        '+'
      )
    )
  );
}

/**
 * Builds an accessible checkbox toggle row.
 * @param {string} id
 * @param {string} label
 * @param {boolean} checked
 * @param {(next: boolean) => void} onChange
 * @returns {HTMLElement}
 */
export function createCheckboxRow(id, label, checked, onChange) {
  return h(
    'label',
    { className: 'checkbox-row', for: id },
    h('input', {
      id,
      type: 'checkbox',
      checked,
      onChange: (e) => onChange(/** @type {HTMLInputElement} */ (e.target).checked)
    }),
    h('span', {}, label)
  );
}

/**
 * Renders Step 2: Household composition & sensitivity.
 * @param {Record<string, any>} draft
 * @param {() => void} rerender
 * @returns {HTMLElement}
 */
export function renderHouseholdStep(draft, rerender) {
  const s = i18n.onboarding.steps;
  return h(
    'div',
    { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' } },
    h('h3', { id: 'wizard-step-heading', tabindex: '-1' }, s.householdTitle),
    h(
      'p',
      { style: { color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' } },
      s.householdSubtitle
    ),
    createStepper('adults', s.adultsLabel, draft.household.adults, 1, 20, (v) => {
      draft.household.adults = v;
      rerender();
    }),
    createStepper('children', s.childrenLabel, draft.household.children, 0, 20, (v) => {
      draft.household.children = v;
      rerender();
    }),
    createStepper('elderly', s.elderlyLabel, draft.household.elderly, 0, 20, (v) => {
      draft.household.elderly = v;
      rerender();
    }),
    createCheckboxRow('hh-pregnant', s.pregnantLabel, draft.household.pregnant, (v) => {
      draft.household.pregnant = v;
    }),
    createCheckboxRow(
      'hh-respiratory',
      s.respiratoryLabel,
      draft.household.respiratoryCondition,
      (v) => {
        draft.household.respiratoryCondition = v;
      }
    ),
    h(
      'p',
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-muted)'
        }
      },
      icon('shield', { size: 14 }),
      s.privacyNote
    )
  );
}
