/**
 * Community and Personal Impact Visualization Component
 * DOM rendering only.
 */
import { createElement, clearElement } from './dom.js';
import { getImpactBadgeTier } from '../domain/impactFactors.js';
import i18n from '../i18n/en.js';

/**
 * Renders the clean air impact metrics dashboard card.
 * @param {HTMLElement} container
 * @param {object} params
 * @param {number} params.co2SavedKg - CO2 emissions avoided.
 * @param {number} params.indoorReduction - Estimated indoor PM2.5 reduction percentage.
 */
export function renderImpact(container, { co2SavedKg = 0, indoorReduction = 0 }) {
  clearElement(container);

  const section = createElement('section', {
    classes: ['card', 'impact-section'],
    attributes: { 'aria-labelledby': 'impact-title' }
  });

  const title = createElement('h2', {
    attributes: { id: 'impact-title' },
    text: i18n.impact.title
  });
  section.appendChild(title);

  const tier = getImpactBadgeTier(co2SavedKg);

  const statsGrid = createElement('div', {
    classes: ['stats-grid'],
    children: [
      createElement('div', {
        classes: ['stat-card'],
        children: [
          createElement('span', { text: i18n.impact.co2SavedLabel }),
          createElement('strong', { text: `${co2SavedKg.toFixed(2)} kg` }),
          createElement('span', {
            classes: ['badge', `badge-${tier}`],
            text: `${tier.toUpperCase()} TIER`
          })
        ]
      }),
      createElement('div', {
        classes: ['stat-card'],
        children: [
          createElement('span', { text: i18n.impact.indoorReductionLabel }),
          createElement('strong', { text: `${indoorReduction}% cleaner indoor air` })
        ]
      })
    ]
  });

  section.appendChild(statsGrid);
  container.appendChild(section);
}
