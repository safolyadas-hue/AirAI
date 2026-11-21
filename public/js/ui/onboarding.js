/**
 * User Profile and Preferences Onboarding Component
 * DOM rendering only.
 */
import { createElement, clearElement } from './dom.js';
import i18n from '../i18n/en.js';

/**
 * Renders the user onboarding and preference form.
 * @param {HTMLElement} container
 * @param {import('../domain/profile.js').UserProfile} currentProfile
 * @param {(updatedProfile: import('../domain/profile.js').UserProfile) => void} onSave
 */
export function renderOnboarding(container, currentProfile, onSave) {
  clearElement(container);

  const formSection = createElement('section', {
    classes: ['card', 'onboarding-section'],
    attributes: { 'aria-labelledby': 'onboarding-title' }
  });

  const title = createElement('h2', {
    attributes: { id: 'onboarding-title' },
    text: i18n.onboarding.heading
  });
  const subhead = createElement('p', { text: i18n.onboarding.subheading });

  const form = createElement('form', { classes: ['onboarding-form'] });

  // Location input
  const locLabel = createElement('label', {
    attributes: { for: 'user-location' },
    text: i18n.onboarding.locationLabel
  });
  const locInput = createElement('input', {
    classes: ['input'],
    attributes: {
      type: 'text',
      id: 'user-location',
      placeholder: i18n.onboarding.locationPlaceholder,
      value: currentProfile.location || ''
    }
  });

  // Sensitive household members checkbox
  const sensitiveContainer = createElement('div', { classes: ['checkbox-group'] });
  const sensitiveCheckbox = createElement('input', {
    attributes: {
      type: 'checkbox',
      id: 'user-vulnerable'
    }
  });
  if (currentProfile.hasVulnerableMembers) {
    sensitiveCheckbox.setAttribute('checked', 'checked');
  }
  const sensitiveLabel = createElement('label', {
    attributes: { for: 'user-vulnerable' },
    text: i18n.onboarding.vulnerableGroupPrompt
  });
  sensitiveContainer.appendChild(sensitiveCheckbox);
  sensitiveContainer.appendChild(sensitiveLabel);

  // Commute select
  const commuteLabel = createElement('label', {
    attributes: { for: 'user-commute' },
    text: i18n.onboarding.commuteModeLabel
  });
  const commuteSelect = createElement('select', {
    attributes: { id: 'user-commute' }
  });
  ['transit', 'car', 'bike', 'walk'].forEach((mode) => {
    const opt = createElement('option', {
      attributes: { value: mode },
      text: mode.toUpperCase()
    });
    if (currentProfile.commuteMode === mode) {
      opt.setAttribute('selected', 'selected');
    }
    commuteSelect.appendChild(opt);
  });

  const submitBtn = createElement('button', {
    classes: ['btn'],
    attributes: { type: 'submit' },
    text: i18n.onboarding.saveButton
  });

  form.appendChild(locLabel);
  form.appendChild(locInput);
  form.appendChild(sensitiveContainer);
  form.appendChild(commuteLabel);
  form.appendChild(commuteSelect);
  form.appendChild(submitBtn);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const updated = {
      location: /** @type {HTMLInputElement} */ (locInput).value.trim(),
      hasVulnerableMembers: /** @type {HTMLInputElement} */ (sensitiveCheckbox).checked,
      commuteMode: /** @type {'car'|'transit'|'bike'|'walk'} */ (
        /** @type {HTMLSelectElement} */ (commuteSelect).value
      ),
      hasAirPurifier: currentProfile.hasAirPurifier
    };
    onSave(updated);
  });

  formSection.appendChild(title);
  formSection.appendChild(subhead);
  formSection.appendChild(form);
  container.appendChild(formSection);
}
