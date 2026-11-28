/**
 * Onboarding Wizard Shell, Step Navigation & Validation
 * Purely UI: delegates search, validation, and submit to injected callbacks.
 */
import { h, clear, mount } from '../dom.js';
import i18n from '../../i18n/en.js';
import { createCityCombobox } from './combobox.js';
import { requestBrowserLocation } from './geolocation.js';
import { renderLocationStep } from './stepLocation.js';
import { renderHouseholdStep } from './stepHousehold.js';
import { renderLifestyleStep } from './stepLifestyle.js';
import { renderHomeBudgetStep } from './stepHomeBudget.js';

const TOTAL_STEPS = 4;

function createDraft(initialProfile) {
  const base = initialProfile || {};
  return {
    location: base.location
      ? { name: base.location.name, lat: base.location.lat, lon: base.location.lon }
      : null,
    household: {
      adults: base.household?.adults ?? 1,
      children: base.household?.children ?? 0,
      elderly: base.household?.elderly ?? 0,
      pregnant: Boolean(base.household?.pregnant),
      respiratoryCondition: Boolean(base.household?.respiratoryCondition)
    },
    commute: {
      mode: base.commute?.mode ?? 'public_transit',
      distanceKm: base.commute?.distanceKm ?? 10
    },
    home: {
      type: base.home?.type ?? 'apartment',
      heating: base.home?.heating ?? 'electric',
      cooking: base.home?.cooking ?? 'induction',
      hasPurifier: Boolean(base.home?.hasPurifier),
      windowsSealed: Boolean(base.home?.windowsSealed)
    },
    budget: base.budget ?? 'medium',
    exerciseOutdoors: Boolean(base.exerciseOutdoors)
  };
}

function createWizardCard({ step, canCancel, stepBody, onBack, onCancel, onNext }) {
  const stepText = i18n.onboarding.stepIndicator
    .replace('{current}', String(step))
    .replace('{total}', String(TOTAL_STEPS));

  return h(
    'div',
    { className: 'wizard-shell animate-fade-up' },
    h(
      'div',
      { className: 'card card-raised' },
      h(
        'div',
        { className: 'wizard-progress' },
        h('h2', { style: { fontSize: 'var(--font-size-lg)' } }, i18n.onboarding.heading),
        h('span', { className: 'badge chip-accent' }, stepText)
      ),
      h(
        'div',
        {
          className: 'wizard-progress-bar',
          style: { marginTop: 'var(--space-3)', marginBottom: 'var(--space-5)' }
        },
        h('div', {
          className: 'wizard-progress-fill',
          style: { width: `${(step / TOTAL_STEPS) * 100}%` }
        })
      ),
      stepBody,
      h(
        'div',
        { className: 'wizard-actions' },
        h(
          'div',
          { style: { display: 'flex', gap: 'var(--space-2)' } },
          step > 1
            ? h(
                'button',
                { type: 'button', className: 'btn btn-secondary', onClick: onBack },
                i18n.onboarding.back
              )
            : null,
          canCancel
            ? h(
                'button',
                { type: 'button', className: 'btn btn-ghost', onClick: () => onCancel?.() },
                i18n.onboarding.cancel
              )
            : null
        ),
        h(
          'button',
          { type: 'button', className: 'btn btn-primary', onClick: onNext },
          step === TOTAL_STEPS ? i18n.onboarding.finish : i18n.onboarding.next
        )
      )
    )
  );
}

function validateWizardStep(step, state) {
  if (step === 1 && (!state.draft.location || typeof state.draft.location.lat !== 'number')) {
    state.locationError = i18n.onboarding.steps.locationRequired;
    return 'city-combobox';
  }
  if (step === 3) {
    const dist = Number(state.rawDistance);
    if (state.rawDistance.trim() === '' || Number.isNaN(dist) || dist < 0 || dist > 300) {
      state.distanceError = i18n.onboarding.steps.distanceError;
      return 'commute-distance-input';
    }
    state.draft.commute.distanceKm = dist;
    state.distanceError = null;
  }
  return null;
}

function advanceOrSubmitWizard(state, rerender, onValidate, onSubmit) {
  const badId = validateWizardStep(state.step, state);
  if (badId) {
    rerender();
    document.getElementById(badId)?.focus();
    return;
  }
  if (state.step < TOTAL_STEPS) {
    state.step += 1;
    rerender();
    document.getElementById('wizard-step-heading')?.focus();
    return;
  }
  const res =
    typeof onValidate === 'function'
      ? onValidate(state.draft)
      : { valid: true, value: state.draft };
  if (!res.valid) {
    state.locationError = res.errors?.[0] || i18n.onboarding.steps.locationRequired;
    state.step = 1;
    rerender();
    document.getElementById('city-combobox')?.focus();
    return;
  }
  onSubmit(res.value, { quickStart: false });
}

function buildStepBody(state, combobox, rerender, onSubmit) {
  if (state.step === 1) {
    return renderLocationStep({
      draft: state.draft,
      combobox,
      locationError: state.locationError,
      onUseMyLocation: () =>
        requestBrowserLocation({
          onSuccess: (loc) => {
            state.draft.location = loc;
            combobox.setQuery(loc.name);
            state.locationError = null;
            rerender();
          },
          onError: (msg) => {
            state.locationError = msg;
            rerender();
          }
        }),
      onQuickStart: () => {
        const badId = validateWizardStep(1, state);
        if (badId) {
          rerender();
          document.getElementById(badId)?.focus();
          return;
        }
        onSubmit({ location: state.draft.location }, { quickStart: true });
      }
    });
  }
  if (state.step === 2) return renderHouseholdStep(state.draft, rerender);
  if (state.step === 3) {
    return renderLifestyleStep(state.draft, state.distanceError, (val) => {
      state.rawDistance = val;
      state.distanceError = null;
    });
  }
  return renderHomeBudgetStep(state.draft, rerender);
}

/**
 * Renders the 4-step onboarding wizard into container.
 * @param {HTMLElement} container
 * @param {object} props
 */
export function renderOnboarding(
  container,
  { initialProfile = null, canCancel = false, onSearchCity, onValidate, onSubmit, onCancel } = {}
) {
  const state = {
    draft: createDraft(initialProfile),
    step: 1,
    locationError: null,
    distanceError: null,
    rawDistance: String(initialProfile?.commute?.distanceKm ?? 10)
  };
  const combobox = createCityCombobox({
    initialQuery: state.draft.location?.name || '',
    onSearchCity,
    onSelect: (item) => {
      state.draft.location = {
        name: item.name || item.label,
        lat: item.latitude,
        lon: item.longitude
      };
      state.locationError = null;
      render();
    }
  });

  function render() {
    clear(container);
    mount(
      container,
      createWizardCard({
        step: state.step,
        canCancel,
        stepBody: buildStepBody(state, combobox, render, onSubmit),
        onBack: () => {
          state.step -= 1;
          render();
          document.getElementById('wizard-step-heading')?.focus();
        },
        onCancel,
        onNext: () => advanceOrSubmitWizard(state, render, onValidate, onSubmit)
      })
    );
    if (state.step === 1) combobox.syncListbox();
  }

  render();
}
