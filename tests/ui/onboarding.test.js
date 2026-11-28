/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderOnboarding } from '../../public/js/ui/onboarding/index.js';

describe('Onboarding Wizard', () => {
  let container;

  beforeEach(() => {
    document.body.innerHTML = '<div id="mount"></div>';
    container = document.getElementById('mount');
    vi.useFakeTimers();
  });

  it('supports ARIA combobox keyboard navigation with 300ms debounce and min 2 chars', async () => {
    const onSearchCity = vi.fn(async () => [
      { id: 1, name: 'Delhi', label: 'Delhi, Delhi, India', latitude: 28.61, longitude: 77.21 },
      { id: 2, name: 'Delli', label: 'Delli, Italy', latitude: 45.0, longitude: 10.0 }
    ]);
    const onSubmit = vi.fn(() => ({ valid: true }));

    renderOnboarding(container, { onSearchCity, onSubmit });

    const input = /** @type {HTMLInputElement} */ (document.getElementById('city-combobox'));
    expect(input.getAttribute('role')).toBe('combobox');

    // 1 char does not trigger search
    input.value = 'D';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    vi.advanceTimersByTime(350);
    expect(onSearchCity).not.toHaveBeenCalled();

    // >= 2 chars triggers debounced search
    input.value = 'De';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    vi.advanceTimersByTime(300);
    await Promise.resolve();
    await Promise.resolve();

    expect(onSearchCity).toHaveBeenCalledWith('De');
    expect(input.getAttribute('aria-expanded')).toBe('true');

    // ArrowDown highlights second option, Enter selects it
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(input.getAttribute('aria-activedescendant')).toBe('loc-opt-1');

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    const updatedInput = /** @type {HTMLInputElement} */ (document.getElementById('city-combobox'));
    expect(updatedInput.value).toBe('Delli, Italy');
  });

  it('shows inline validation error with aria-invalid when advancing without location', () => {
    const onSearchCity = vi.fn(async () => []);
    const onSubmit = vi.fn(() => ({ valid: true }));

    renderOnboarding(container, { onSearchCity, onSubmit });

    const nextBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Next')
    );
    nextBtn?.click();

    const input = document.getElementById('city-combobox');
    expect(input?.getAttribute('aria-invalid')).toBe('true');
    expect(input?.getAttribute('aria-describedby')).toBe('location-error-msg');
    expect(document.getElementById('location-error-msg')?.textContent).toContain('select a city');
  });

  it('navigates all 4 steps with Step X of 4 indicator and supports Quick start', async () => {
    const onSearchCity = vi.fn(async () => [
      { id: 1, name: 'Delhi', label: 'Delhi, India', latitude: 28.61, longitude: 77.21 }
    ]);
    const onSubmit = vi.fn(() => ({ valid: true }));

    renderOnboarding(container, {
      initialProfile: {
        location: { name: 'Delhi', lat: 28.61, lon: 77.21 },
        household: {
          adults: 1,
          children: 0,
          elderly: 0,
          pregnant: false,
          respiratoryCondition: false
        },
        commute: { mode: 'public_transit', distanceKm: 10 },
        home: {
          type: 'apartment',
          heating: 'electric',
          cooking: 'induction',
          hasPurifier: false,
          windowsSealed: false
        },
        budget: 'medium',
        exerciseOutdoors: false
      },
      onSearchCity,
      onSubmit
    });

    expect(container.textContent).toContain('Step 1 of 4');

    // Quick start submits immediately with location
    const quickBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Quick start')
    );
    quickBtn?.click();
    expect(onSubmit).toHaveBeenCalledWith(
      { location: { name: 'Delhi', lat: 28.61, lon: 77.21 } },
      { quickStart: true }
    );

    // Step forward through 2, 3, 4
    const clickNext = () => {
      const btn = Array.from(container.querySelectorAll('button')).find(
        (b) => b.textContent === 'Next' || b.textContent === 'Get my plan'
      );
      btn?.click();
    };

    clickNext();
    expect(container.textContent).toContain('Step 2 of 4');
    expect(document.activeElement?.id).toBe('wizard-step-heading');

    clickNext();
    expect(container.textContent).toContain('Step 3 of 4');

    clickNext();
    expect(container.textContent).toContain('Step 4 of 4');
  });
});
