/**
 * 4-Step Onboarding & Profile Setup Wizard
 * Implements ARIA combobox city search, geolocation on click, household/lifestyle/home steps,
 * Quick start, and accessible inline validation.
 */
import { CACHE_CONFIG } from '../config.js';
import { validateProfile } from '../domain/profile.js';
import { h, clear, mount } from './dom.js';
import { icon } from './icons.js';
import i18n from '../i18n/en.js';
import {
  renderHouseholdStep,
  renderLifestyleStep,
  renderHomeBudgetStep
} from './onboardingSteps.js';

const TOTAL_STEPS = 4;

/**
 * Creates a mutable draft profile from an existing profile or clean defaults.
 * @param {import('../domain/profile.js').UserProfile | null} initialProfile
 * @returns {Record<string, any>}
 */
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

/**
 * Renders the 4-step onboarding wizard into container.
 * @param {HTMLElement} container
 * @param {object} props
 * @param {import('../domain/profile.js').UserProfile | null} [props.initialProfile=null]
 * @param {boolean} [props.canCancel=false]
 * @param {(q: string) => Promise<Array<any>>} props.onSearchCity
 * @param {(profile: Record<string, any>, opts?: { quickStart?: boolean }) => { valid: boolean, errors?: string[] }} props.onSubmit
 * @param {() => void} [props.onCancel]
 */
export function renderOnboarding(
  container,
  { initialProfile = null, canCancel = false, onSearchCity, onSubmit, onCancel } = {}
) {
  const draft = createDraft(initialProfile);
  let step = 1;
  let searchQuery = draft.location?.name || '';
  let searchResults = [];
  let searchStatus = '';
  let isListOpen = false;
  let activeIndex = -1;
  let searchSeq = 0;
  let debounceTimer = null;
  let locationError = null;
  let distanceError = null;
  let rawDistance = String(draft.commute.distanceKm);

  const focusStepHeading = () => {
    const heading = document.getElementById('wizard-step-heading');
    if (heading) heading.focus();
  };

  const selectResult = (item) => {
    draft.location = {
      name: item.name || item.label,
      lat: item.latitude,
      lon: item.longitude
    };
    searchQuery = item.label || item.name;
    isListOpen = false;
    activeIndex = -1;
    locationError = null;
    render();
  };

  const handleGeolocation = () => {
    const s = i18n.onboarding.steps;
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      locationError = s.geoUnsupported;
      render();
      return;
    }
    searchStatus = s.locating;
    locationError = null;
    render();

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        draft.location = {
          name: s.myLocationName,
          lat: Number(pos.coords.latitude.toFixed(2)),
          lon: Number(pos.coords.longitude.toFixed(2))
        };
        searchQuery = s.myLocationName;
        searchStatus = '';
        locationError = null;
        render();
      },
      (err) => {
        searchStatus = '';
        if (err.code === 1) locationError = s.geoDenied;
        else if (err.code === 3) locationError = s.geoTimeout;
        else locationError = s.geoUnavailable;
        render();
      },
      { timeout: 10000 }
    );
  };

  const runSearch = async (q) => {
    const s = i18n.onboarding.steps;
    const seq = ++searchSeq;
    searchStatus = s.searching;
    isListOpen = true;
    renderListboxOnly();

    try {
      const results = await onSearchCity(q);
      if (seq !== searchSeq) return;
      searchResults = Array.isArray(results) ? results : [];
      activeIndex = searchResults.length > 0 ? 0 : -1;
      searchStatus = searchResults.length === 0 ? s.noResults : '';
      isListOpen = true;
      renderListboxOnly();
    } catch {
      if (seq !== searchSeq) return;
      searchResults = [];
      activeIndex = -1;
      searchStatus = s.searchError;
      isListOpen = false;
      renderListboxOnly();
    }
  };

  const renderListboxOnly = () => {
    const box = document.getElementById('location-listbox');
    const input = /** @type {HTMLInputElement | null} */ (document.getElementById('city-combobox'));
    const statusEl = document.getElementById('location-search-status');
    if (statusEl) statusEl.textContent = searchStatus;
    if (!box || !input) return;

    clear(box);
    const open = isListOpen && searchResults.length > 0;
    input.setAttribute('aria-expanded', open ? 'true' : 'false');
    input.setAttribute(
      'aria-activedescendant',
      open && activeIndex >= 0 ? `loc-opt-${activeIndex}` : ''
    );
    box.hidden = !open;

    if (!open) return;
    searchResults.forEach((item, idx) => {
      const li = h(
        'li',
        {
          id: `loc-opt-${idx}`,
          role: 'option',
          className: 'combobox-option',
          'aria-selected': idx === activeIndex ? 'true' : 'false',
          onMouseDown: (e) => {
            e.preventDefault();
            selectResult(item);
          }
        },
        item.label || item.name
      );
      box.appendChild(li);
    });
  };

  const validateCurrentStep = () => {
    const s = i18n.onboarding.steps;
    if (step === 1) {
      if (!draft.location || typeof draft.location.lat !== 'number') {
        locationError = s.locationRequired;
        render();
        document.getElementById('city-combobox')?.focus();
        return false;
      }
      locationError = null;
      return true;
    }
    if (step === 3) {
      const dist = Number(rawDistance);
      if (rawDistance.trim() === '' || Number.isNaN(dist) || dist < 0 || dist > 300) {
        distanceError = s.distanceError;
        render();
        document.getElementById('commute-distance-input')?.focus();
        return false;
      }
      draft.commute.distanceKm = dist;
      distanceError = null;
      return true;
    }
    return true;
  };

  const handleNextOrSubmit = () => {
    if (!validateCurrentStep()) return;
    if (step < TOTAL_STEPS) {
      step += 1;
      render();
      focusStepHeading();
      return;
    }
    const validation = validateProfile(draft);
    if (!validation.valid) {
      locationError = validation.errors[0] || i18n.onboarding.steps.locationRequired;
      step = 1;
      render();
      document.getElementById('city-combobox')?.focus();
      return;
    }
    onSubmit(validation.value, { quickStart: false });
  };

  const handleQuickStart = () => {
    if (!draft.location || typeof draft.location.lat !== 'number') {
      locationError = i18n.onboarding.steps.locationRequired;
      render();
      document.getElementById('city-combobox')?.focus();
      return;
    }
    onSubmit({ location: draft.location }, { quickStart: true });
  };

  const renderLocationStep = () => {
    const s = i18n.onboarding.steps;
    const input = h('input', {
      id: 'city-combobox',
      className: 'form-input',
      type: 'text',
      role: 'combobox',
      autocomplete: 'off',
      value: searchQuery,
      placeholder: s.cityPlaceholder,
      'aria-autocomplete': 'list',
      'aria-expanded': isListOpen && searchResults.length > 0 ? 'true' : 'false',
      'aria-controls': 'location-listbox',
      'aria-activedescendant': isListOpen && activeIndex >= 0 ? `loc-opt-${activeIndex}` : '',
      'aria-invalid': locationError ? 'true' : 'false',
      'aria-describedby': locationError ? 'location-error-msg' : undefined,
      onInput: (e) => {
        const val = /** @type {HTMLInputElement} */ (e.target).value;
        searchQuery = val;
        if (debounceTimer) clearTimeout(debounceTimer);
        if (val.trim().length < CACHE_CONFIG.SEARCH_MIN_CHARS) {
          searchResults = [];
          isListOpen = false;
          searchStatus = '';
          renderListboxOnly();
          return;
        }
        debounceTimer = setTimeout(() => runSearch(val.trim()), CACHE_CONFIG.SEARCH_DEBOUNCE_MS);
      },
      onKeyDown: (e) => {
        if (e.key === 'ArrowDown' && searchResults.length > 0) {
          e.preventDefault();
          isListOpen = true;
          activeIndex = (activeIndex + 1) % searchResults.length;
          renderListboxOnly();
        } else if (e.key === 'ArrowUp' && searchResults.length > 0) {
          e.preventDefault();
          isListOpen = true;
          activeIndex = (activeIndex - 1 + searchResults.length) % searchResults.length;
          renderListboxOnly();
        } else if (
          e.key === 'Enter' &&
          isListOpen &&
          activeIndex >= 0 &&
          searchResults[activeIndex]
        ) {
          e.preventDefault();
          selectResult(searchResults[activeIndex]);
        } else if (e.key === 'Escape') {
          isListOpen = false;
          activeIndex = -1;
          renderListboxOnly();
        }
      }
    });

    const listbox = h('ul', {
      id: 'location-listbox',
      role: 'listbox',
      className: 'combobox-listbox',
      hidden: !(isListOpen && searchResults.length > 0)
    });

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
        h(
          'div',
          {
            id: 'location-search-status',
            role: 'status',
            'aria-live': 'polite',
            style: { fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }
          },
          searchStatus
        ),
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
        {
          style: { display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }
        },
        h(
          'button',
          { type: 'button', className: 'btn btn-secondary', onClick: handleGeolocation },
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
          {
            type: 'button',
            className: 'btn btn-ghost',
            onClick: handleQuickStart
          },
          i18n.onboarding.quickStartLink
        )
      )
    );
  };

  function render() {
    clear(container);
    const stepText = i18n.onboarding.stepIndicator
      .replace('{current}', String(step))
      .replace('{total}', String(TOTAL_STEPS));

    let stepBody;
    if (step === 1) stepBody = renderLocationStep();
    else if (step === 2) stepBody = renderHouseholdStep(draft, render);
    else if (step === 3) {
      stepBody = renderLifestyleStep(draft, distanceError, (val) => {
        rawDistance = val;
        distanceError = null;
      });
    } else {
      stepBody = renderHomeBudgetStep(draft, render);
    }

    const card = h(
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
                  {
                    type: 'button',
                    className: 'btn btn-secondary',
                    onClick: () => {
                      step -= 1;
                      render();
                      focusStepHeading();
                    }
                  },
                  i18n.onboarding.back
                )
              : null,
            canCancel
              ? h(
                  'button',
                  {
                    type: 'button',
                    className: 'btn btn-ghost',
                    onClick: () => onCancel && onCancel()
                  },
                  i18n.onboarding.cancel
                )
              : null
          ),
          h(
            'button',
            { type: 'button', className: 'btn btn-primary', onClick: handleNextOrSubmit },
            step === TOTAL_STEPS ? i18n.onboarding.finish : i18n.onboarding.next
          )
        )
      )
    );

    mount(container, card);
    if (step === 1) renderListboxOnly();
  }

  render();
}
