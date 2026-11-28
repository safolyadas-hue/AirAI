/**
 * Today View - Pollutant Readout Tiles
 * Renders the 4-pollutant concentration row (PM2.5, PM10, NO2, O3) inside the hero card.
 */
import { h } from '../dom.js';
import i18n from '../../i18n/en.js';

/**
 * Builds the 4-pollutant readout row inside the hero card.
 * @param {Record<string, number | undefined>} airSnapshot
 * @param {string} dominantPollutant
 * @returns {HTMLElement}
 */
export function createPollutantRow(airSnapshot, dominantPollutant) {
  const keys = ['pm2_5', 'pm10', 'no2', 'o3'];
  const tiles = keys.map((key) => {
    const val = airSnapshot?.[key];
    const displayVal = typeof val === 'number' ? `${val.toFixed(1)} ${i18n.hero.unitUgM3}` : '—';
    const isDominant = key === dominantPollutant;

    return h(
      'div',
      { className: `pollutant-tile ${isDominant ? 'pollutant-tile--dominant' : ''}` },
      h('span', { className: 'pollutant-label' }, i18n.hero.pollutants[key] || key.toUpperCase()),
      h('span', { className: 'pollutant-value tabular-nums' }, displayVal)
    );
  });

  return h('div', { className: 'pollutant-row' }, ...tiles);
}
