/**
 * Onboarding - Step 1: Location Search & Geolocation
 */
import { h } from '../dom.js';
import { icon } from '../icons.js';
import i18n from '../../i18n/en.js';

/**
 * Renders Step 1 of the onboarding wizard.
 * @param {{ draft: Record<string, any>, combobox: any, locationError: string | null, onUseMyLocation: () => void, onQuickStart: () => void }} props
 * @returns {HTMLElement}
 */
export function renderLocationStep({
  draft,
  combobox,
  locationError,
  onUseMyLocation,
  onQuickStart
}) {
  const s = i18n.onboarding.steps;
  const { input, statusEl, listbox } = combobox.renderElements(locationError);

  return h(
    'div',
    { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' } },
    h('h3', { id: 'wizard-step-heading', tabindex: '-1' }, s.locationTitle),
    h(
      'p',
      { style: { color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' } },
      s.locationSubtitle
    ),
    h(
      'div',
      { className: 'form-group combobox-wrap' },
      h('label', { className: 'form-label', for: 'city-combobox' }, s.cityLabel),
      input,
      statusEl,
      listbox,
      locationError
        ? h(
            'div',
            { id: 'location-error-msg', className: 'field-error', role: 'alert' },
            icon('alert', { size: 16 }),
            locationError
          )
        : null
    ),
    h(
      'div',
      { style: { display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' } },
      h(
        'button',
        { type: 'button', className: 'btn btn-secondary', onClick: onUseMyLocation },
        icon('location', { size: 16 }),
        s.useMyLocation
      ),
      draft.location
        ? h(
            'span',
            { className: 'chip chip-accent' },
            icon('check', { size: 14 }),
            `${s.selectedLocation} ${draft.location.name}`
          )
        : null
    ),
    h(
      'div',
      {},
      h(
        'button',
        { type: 'button', className: 'btn btn-ghost', onClick: onQuickStart },
        i18n.onboarding.quickStartLink
      )
    )
  );
}
