/**
 * Clean Air Impact View
 * Visualizes estimated weekly CO2 avoided and indoor PM2.5 reduction ranges with transparent assumptions.
 */
import { h, clear, mount } from './dom.js';
import { icon } from './icons.js';
import i18n from '../i18n/en.js';

/**
 * Creates a prominent statistical tile.
 * @param {string} title
 * @param {string | number} value
 * @param {string} unit
 * @param {string} iconName
 * @returns {HTMLElement}
 */
function createStatTile(title, value, unit, iconName) {
  return h(
    'div',
    { className: 'stat-tile col-span-6' },
    h(
      'div',
      { style: { display: 'flex', alignItems: 'center', gap: 'var(--space-2)' } },
      icon(iconName, { size: 18 }),
      h(
        'span',
        {
          style: {
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-muted)',
            fontWeight: '600'
          }
        },
        title
      )
    ),
    h(
      'div',
      {
        style: { display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)', flexWrap: 'wrap' }
      },
      h('span', { className: 'stat-number tabular-nums' }, String(value)),
      h(
        'span',
        { style: { fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' } },
        unit
      )
    )
  );
}

/**
 * Renders the clean air impact estimates view.
 * @param {HTMLElement} container
 * @param {object} [props={}]
 * @param {number} [props.estimatedWeeklyCo2Kg=8.5]
 */
export function renderImpact(container, { estimatedWeeklyCo2Kg = 8.5 } = {}) {
  clear(container);

  const header = h(
    'div',
    { className: 'card card-raised col-span-12' },
    h('h2', { id: 'impact-heading' }, i18n.impact.heading),
    h(
      'p',
      { style: { color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' } },
      i18n.impact.subheading
    )
  );

  const co2Tile = createStatTile(
    i18n.impact.co2SavedTitle,
    `~${estimatedWeeklyCo2Kg.toFixed(1)}`,
    i18n.impact.co2Metric,
    'leaf'
  );

  const indoorTile = createStatTile(
    i18n.impact.indoorReductionTitle,
    i18n.impact.indoorReductionRange,
    i18n.impact.indoorMetric,
    'home'
  );

  const assumptionsCard = h(
    'div',
    { className: 'card card-tinted col-span-6' },
    h(
      'div',
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-2)'
        }
      },
      icon('info', { size: 18 }),
      h('h3', { style: { fontSize: 'var(--font-size-md)' } }, i18n.impact.assumptionsTitle)
    ),
    h(
      'p',
      { style: { fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' } },
      i18n.impact.assumptionsBody
    )
  );

  const calculatorCard = h(
    'div',
    { className: 'card col-span-6' },
    h(
      'div',
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-2)'
        }
      },
      icon('bike', { size: 18 }),
      h('h3', { style: { fontSize: 'var(--font-size-md)' } }, i18n.impact.calculatorTitle)
    ),
    h(
      'p',
      { style: { fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' } },
      i18n.impact.calculatorBody
    )
  );

  const view = h(
    'div',
    { className: 'bento-grid animate-fade-up', 'aria-labelledby': 'impact-heading' },
    header,
    co2Tile,
    indoorTile,
    assumptionsCard,
    calculatorCard
  );

  mount(container, view);
}

// Backward compatibility helper
export const renderImpactView = renderImpact;
