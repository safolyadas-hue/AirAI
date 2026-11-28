/**
 * Onboarding Wizard Step Renderers (Steps 2, 3, and 4)
 * Keeps onboarding.js focused on navigation, location combobox, and validation.
 */
import { h } from './dom.js';
import { icon } from './icons.js';
import i18n from '../i18n/en.js';

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
 * Builds a fieldset of visually styled native radio cards with icons.
 * @param {string} name
 * @param {string} legend
 * @param {Array<{ value: string, label: string, iconName: string }>} options
 * @param {string} selectedValue
 * @param {(val: string) => void} onSelect
 * @returns {HTMLElement}
 */
function createRadioCardGroup(name, legend, options, selectedValue, onSelect) {
  return h(
    'fieldset',
    { className: 'radio-fieldset' },
    h('legend', { className: 'radio-legend' }, legend),
    h(
      'div',
      { className: 'radio-card-grid' },
      ...options.map((opt) =>
        h(
          'label',
          { className: 'radio-card' },
          h('input', {
            type: 'radio',
            name,
            value: opt.value,
            checked: selectedValue === opt.value,
            onChange: () => onSelect(opt.value)
          }),
          icon(opt.iconName, { size: 18 }),
          h('span', {}, opt.label)
        )
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
function createCheckboxRow(id, label, checked, onChange) {
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
 * @param {object} draft
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

/**
 * Renders Step 3: Lifestyle (commute, distance, heating, cooking).
 * @param {object} draft
 * @param {string | null} distanceError
 * @param {(val: string) => void} onDistanceInput
 * @returns {HTMLElement}
 */
export function renderLifestyleStep(draft, distanceError, onDistanceInput) {
  const s = i18n.onboarding.steps;
  const opts = i18n.onboarding.options;

  const commuteOptions = [
    { value: 'walk', label: opts.commute.walk, iconName: 'wind' },
    { value: 'cycle', label: opts.commute.cycle, iconName: 'bike' },
    { value: 'public_transit', label: opts.commute.public_transit, iconName: 'bus' },
    { value: 'two_wheeler', label: opts.commute.two_wheeler, iconName: 'bike' },
    { value: 'car', label: opts.commute.car, iconName: 'bus' },
    { value: 'work_from_home', label: opts.commute.work_from_home, iconName: 'home' }
  ];

  const heatingOptions = [
    { value: 'electric', label: opts.heating.electric, iconName: 'sun' },
    { value: 'gas', label: opts.heating.gas, iconName: 'flame' },
    { value: 'wood_biomass', label: opts.heating.wood_biomass, iconName: 'flame' },
    { value: 'coal', label: opts.heating.coal, iconName: 'flame' },
    { value: 'none', label: opts.heating.none, iconName: 'shield' }
  ];

  const cookingOptions = [
    { value: 'induction', label: opts.cooking.induction, iconName: 'sun' },
    { value: 'electric', label: opts.cooking.electric, iconName: 'sun' },
    { value: 'lpg', label: opts.cooking.lpg, iconName: 'flame' },
    { value: 'biomass', label: opts.cooking.biomass, iconName: 'flame' }
  ];

  return h(
    'div',
    { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' } },
    h('h3', { id: 'wizard-step-heading', tabindex: '-1' }, s.lifestyleTitle),
    h(
      'p',
      { style: { color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' } },
      s.lifestyleSubtitle
    ),
    createRadioCardGroup(
      'commute-mode',
      s.commuteLegend,
      commuteOptions,
      draft.commute.mode,
      (v) => {
        draft.commute.mode = v;
      }
    ),
    h(
      'div',
      { className: 'form-group' },
      h('label', { className: 'form-label', for: 'commute-distance-input' }, s.distanceLabel),
      h('input', {
        id: 'commute-distance-input',
        className: 'form-input',
        type: 'number',
        min: '0',
        max: '300',
        value: String(draft.commute.distanceKm),
        'aria-invalid': distanceError ? 'true' : 'false',
        'aria-describedby': distanceError ? 'distance-error-msg' : undefined,
        onInput: (e) => onDistanceInput(/** @type {HTMLInputElement} */ (e.target).value)
      }),
      distanceError
        ? h(
            'div',
            { id: 'distance-error-msg', className: 'field-error', role: 'alert' },
            icon('alert', { size: 16 }),
            distanceError
          )
        : null
    ),
    createRadioCardGroup(
      'heating-mode',
      s.heatingLegend,
      heatingOptions,
      draft.home.heating,
      (v) => {
        draft.home.heating = v;
      }
    ),
    createRadioCardGroup(
      'cooking-mode',
      s.cookingLegend,
      cookingOptions,
      draft.home.cooking,
      (v) => {
        draft.home.cooking = v;
      }
    )
  );
}

/**
 * Renders Step 4: Home setup, budget segmented control, and outdoor exercise.
 * @param {object} draft
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
