/**
 * Onboarding - Step 3: Lifestyle (Commute, Distance, Heating, Cooking)
 */
import { h } from '../dom.js';
import { icon } from '../icons.js';
import i18n from '../../i18n/en.js';

/**
 * Builds a fieldset of visually styled native radio cards with icons.
 * @param {string} name
 * @param {string} legend
 * @param {Array<{ value: string, label: string, iconName: string }>} options
 * @param {string} selectedValue
 * @param {(val: string) => void} onSelect
 * @returns {HTMLElement}
 */
export function createRadioCardGroup(name, legend, options, selectedValue, onSelect) {
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

const getLifestyleOptions = () => {
  const opts = i18n.onboarding.options;
  return {
    commute: [
      { value: 'walk', label: opts.commute.walk, iconName: 'wind' },
      { value: 'cycle', label: opts.commute.cycle, iconName: 'bike' },
      { value: 'public_transit', label: opts.commute.public_transit, iconName: 'bus' },
      { value: 'two_wheeler', label: opts.commute.two_wheeler, iconName: 'bike' },
      { value: 'car', label: opts.commute.car, iconName: 'bus' },
      { value: 'work_from_home', label: opts.commute.work_from_home, iconName: 'home' }
    ],
    heating: [
      { value: 'electric', label: opts.heating.electric, iconName: 'sun' },
      { value: 'gas', label: opts.heating.gas, iconName: 'flame' },
      { value: 'wood_biomass', label: opts.heating.wood_biomass, iconName: 'flame' },
      { value: 'coal', label: opts.heating.coal, iconName: 'flame' },
      { value: 'none', label: opts.heating.none, iconName: 'shield' }
    ],
    cooking: [
      { value: 'induction', label: opts.cooking.induction, iconName: 'sun' },
      { value: 'electric', label: opts.cooking.electric, iconName: 'sun' },
      { value: 'lpg', label: opts.cooking.lpg, iconName: 'flame' },
      { value: 'biomass', label: opts.cooking.biomass, iconName: 'flame' }
    ]
  };
};

/**
 * Renders Step 3: Lifestyle (commute, distance, heating, cooking).
 * @param {Record<string, any>} draft
 * @param {string | null} distanceError
 * @param {(val: string) => void} onDistanceInput
 * @returns {HTMLElement}
 */
export function renderLifestyleStep(draft, distanceError, onDistanceInput) {
  const s = i18n.onboarding.steps;
  const groups = getLifestyleOptions();

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
      groups.commute,
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
      groups.heating,
      draft.home.heating,
      (v) => {
        draft.home.heating = v;
      }
    ),
    createRadioCardGroup(
      'cooking-mode',
      s.cookingLegend,
      groups.cooking,
      draft.home.cooking,
      (v) => {
        draft.home.cooking = v;
      }
    )
  );
}
