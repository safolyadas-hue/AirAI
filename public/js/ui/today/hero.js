/**
 * Today View - Circular AQI Gauge & Hero Card
 */
import { h } from '../dom.js';
import { icon } from '../icons.js';
import i18n from '../../i18n/en.js';
import { createPollutantRow } from './pollutants.js';

/**
 * Formats relative time since last update.
 * @param {number | null} lastUpdatedAt
 * @returns {string}
 */
export function formatRelativeUpdated(lastUpdatedAt) {
  if (!lastUpdatedAt) return i18n.status.updatedJustNow;
  const diffMin = Math.max(0, Math.floor((Date.now() - lastUpdatedAt) / 60000));
  if (diffMin < 1) return i18n.status.updatedJustNow;
  if (diffMin < 60) return i18n.status.updatedMinutesAgo.replace('{min}', String(diffMin));
  const diffHr = Math.floor(diffMin / 60);
  return i18n.status.updatedHoursAgo.replace('{hr}', String(diffHr));
}

/**
 * Calculates SVG stroke-dashoffset for the circular gauge.
 * @param {number} aqi
 * @returns {number}
 */
function calculateGaugeOffset(aqi) {
  const circumference = 408.4;
  const clamped = Math.max(0, Math.min(aqi, 500));
  return Math.round(circumference - (clamped / 500) * circumference);
}

/**
 * Builds the animated SVG circular gauge.
 * @param {number} aqi
 * @param {string} categoryLabel
 * @param {string} pollutant
 * @returns {HTMLElement}
 */
export function createAqiGauge(aqi, categoryLabel, pollutant) {
  const circumference = 408.4;
  const offset = calculateGaugeOffset(aqi);
  const ariaLabel = `${aqi} US Air Quality Index, ${categoryLabel}. Main pollutant: ${pollutant.toUpperCase()}.`;
  const isThreeDigits = String(Math.round(aqi)).length >= 3;

  const svg = h(
    'svg',
    { className: 'gauge-svg', viewBox: '0 0 160 160', role: 'img', 'aria-label': ariaLabel },
    h('title', {}, `${i18n.hero.gaugeTitle}: ${aqi}`),
    h('desc', {}, i18n.hero.gaugeDesc),
    h('circle', { className: 'gauge-track', cx: '80', cy: '80', r: '65' }),
    h('circle', {
      className: 'gauge-fill',
      cx: '80',
      cy: '80',
      r: '65',
      'stroke-dasharray': String(circumference),
      'stroke-dashoffset': String(offset)
    })
  );

  return h(
    'div',
    { className: 'gauge-svg-wrapper' },
    svg,
    h(
      'div',
      { className: 'gauge-center' },
      h(
        'span',
        { className: `gauge-number tabular-nums ${isThreeDigits ? 'gauge-number--3digit' : ''}` },
        String(Math.round(aqi))
      ),
      h('span', { className: 'gauge-sublabel' }, 'US AQI')
    )
  );
}

/**
 * Builds the Hero Card with gauge, category badge, headline, pollutant tiles, and refresh button.
 * @param {object} props
 * @returns {HTMLElement}
 */
export function createHeroCard({
  snapshot,
  categoryKey,
  categoryLabel,
  headlineText,
  aiNote,
  lastUpdatedAt,
  onRefresh
}) {
  const domKey = snapshot.dominantPollutant?.pollutant || 'pm2_5';
  const badges = h(
    'div',
    { style: { display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' } },
    h(
      'span',
      { className: 'badge chip-accent' },
      icon(`aqi-${categoryKey}`, { size: 14 }),
      categoryLabel
    ),
    h(
      'span',
      {
        className: 'chip',
        style: { background: 'var(--color-surface)', border: '1px solid var(--color-border)' }
      },
      `${i18n.hero.dominantPrefix} ${domKey.toUpperCase().replace('_', '.')}`
    )
  );
  const refreshRow = h(
    'div',
    { style: { display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' } },
    h(
      'span',
      {
        style: {
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-muted)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--space-1)'
        }
      },
      icon('clock', { size: 13 }),
      formatRelativeUpdated(lastUpdatedAt)
    ),
    h(
      'button',
      { type: 'button', className: 'btn btn-secondary', onClick: onRefresh },
      icon('refresh', { size: 14 }),
      i18n.status.refreshButton
    )
  );

  return h(
    'div',
    { className: 'hero-card col-span-12' },
    h('div', { className: 'hero-haze-layer', 'aria-hidden': 'true' }),
    h('div', { className: 'hero-haze-layer hero-haze-layer-2', 'aria-hidden': 'true' }),
    h(
      'div',
      { className: 'hero-content' },
      createAqiGauge(snapshot.aqi, categoryLabel, domKey),
      h(
        'div',
        { className: 'hero-text-col' },
        badges,
        h('h2', { style: { marginTop: 'var(--space-1)' } }, headlineText),
        aiNote,
        createPollutantRow(snapshot, domKey),
        refreshRow
      )
    )
  );
}
