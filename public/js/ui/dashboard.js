/**
 * Today / Air Quality Dashboard View
 * Renders the circular animated SVG AQI gauge, pollutant readout row, priority actions, and 24-hr timeline.
 */
import { h, clear, mount } from './dom.js';
import { icon } from './icons.js';
import i18n from '../i18n/en.js';

/**
 * Calculates SVG stroke-dashoffset for the circular gauge.
 * Circumference for radius 65 = 2 * PI * 65 ≈ 408.4
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
function createAqiGauge(aqi, categoryLabel, pollutant) {
  const circumference = 408.4;
  const offset = calculateGaugeOffset(aqi);
  const ariaLabel = `${aqi} US Air Quality Index, ${categoryLabel}. Main pollutant: ${pollutant.toUpperCase()}.`;
  const isThreeDigits = String(Math.round(aqi)).length >= 3;

  const svg = h(
    'svg',
    {
      className: 'gauge-svg',
      viewBox: '0 0 160 160',
      role: 'img',
      'aria-label': ariaLabel
    },
    h('title', {}, `${i18n.hero.gaugeTitle}: ${aqi}`),
    h('desc', {}, i18n.hero.gaugeDesc),
    h('circle', {
      className: 'gauge-track',
      cx: '80',
      cy: '80',
      r: '65'
    }),
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
        String(aqi)
      ),
      h('span', { className: 'gauge-sublabel' }, 'US AQI')
    )
  );
}

/**
 * Builds the 4-pollutant readout row inside the hero card.
 * @param {{ pm2_5?: number, pm10?: number, no2?: number, o3?: number }} pollutants
 * @param {string} dominantPollutant
 * @returns {HTMLElement}
 */
function createPollutantRow(pollutants, dominantPollutant) {
  const keys = ['pm2_5', 'pm10', 'no2', 'o3'];
  const tiles = keys.map((key) => {
    const val = pollutants?.[key];
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

/**
 * Builds the 24-hour timeline strip for ventilation and outdoor windows.
 * @param {Array<{ time: string, aqi: number, isBest?: boolean, isWorst?: boolean }>} hourly
 * @returns {HTMLElement}
 */
function createTimelineStrip(hourly = []) {
  const items = hourly.map((item) => {
    const isBest = Boolean(item.isBest);
    const isWorst = Boolean(item.isWorst);
    const badgeText = isBest
      ? i18n.today.bestWindowLabel
      : isWorst
        ? i18n.today.worstWindowLabel
        : '';

    return h(
      'div',
      { className: `timeline-hour ${isBest ? 'is-best' : ''}` },
      h(
        'span',
        { style: { fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' } },
        item.time
      ),
      h(
        'strong',
        { className: 'tabular-nums', style: { fontSize: 'var(--font-size-sm)' } },
        `${item.aqi}`
      ),
      badgeText
        ? h(
            'span',
            {
              className: `badge ${isBest ? 'badge-cost-free' : 'badge-effort-high'}`,
              style: { fontSize: 'var(--font-size-xs)', padding: '2px 6px' }
            },
            isBest ? 'Clean' : 'Smog'
          )
        : null
    );
  });

  return h(
    'section',
    { className: 'card card-raised col-span-12', 'aria-labelledby': 'timeline-heading' },
    h(
      'div',
      { style: { marginBottom: 'var(--space-3)' } },
      h('h3', { id: 'timeline-heading' }, i18n.today.timelineTitle),
      h(
        'p',
        { style: { fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' } },
        i18n.today.timelineSubhead
      )
    ),
    h(
      'div',
      {
        className: 'timeline-strip',
        tabindex: '0',
        role: 'region',
        'aria-label': i18n.today.timelineAriaLabel
      },
      ...items
    )
  );
}

/**
 * Renders the Today dashboard view into the target container.
 * @param {HTMLElement} container
 * @param {object} props
 * @param {number} [props.aqi=185]
 * @param {string} [props.categoryKey='unhealthy']
 * @param {string} [props.categoryLabel='Unhealthy']
 * @param {string} [props.dominantPollutant='pm2_5']
 * @param {{ pm2_5?: number, pm10?: number, no2?: number, o3?: number }} [props.pollutants={}]
 * @param {string} [props.headline='']
 * @param {Array<object>} [props.actions=[]]
 * @param {Array<object>} [props.hourly=[]]
 */
export function renderTodayView(
  container,
  {
    aqi = 185,
    categoryKey = 'unhealthy',
    categoryLabel = 'Unhealthy',
    dominantPollutant = 'pm2_5',
    pollutants = {},
    headline = '',
    actions = [],
    hourly = []
  } = {}
) {
  clear(container);

  const heroCard = h(
    'div',
    { className: 'hero-card col-span-12' },
    h('div', { className: 'hero-haze-layer', 'aria-hidden': 'true' }),
    h('div', { className: 'hero-haze-layer hero-haze-layer-2', 'aria-hidden': 'true' }),
    h(
      'div',
      { className: 'hero-content' },
      createAqiGauge(aqi, categoryLabel, dominantPollutant),
      h(
        'div',
        { className: 'hero-text-col' },
        h(
          'div',
          {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              flexWrap: 'wrap'
            }
          },
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
            `${i18n.hero.dominantPrefix} ${dominantPollutant.toUpperCase().replace('_', '.')}`
          )
        ),
        h('h2', { style: { marginTop: 'var(--space-1)' } }, headline || i18n.today.riskBannerTitle),
        createPollutantRow(pollutants, dominantPollutant),
        h(
          'p',
          {
            style: {
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1)'
            }
          },
          icon('clock', { size: 13 }),
          i18n.hero.updatedJustNow
        )
      )
    )
  );

  const actionCards = actions.map((act) =>
    h(
      'div',
      { className: 'card card-interactive col-span-4' },
      h(
        'div',
        {
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-2)',
            gap: 'var(--space-2)',
            flexWrap: 'wrap'
          }
        },
        h('span', { className: 'badge chip-accent' }, act.category),
        h(
          'span',
          {
            className: `badge ${act.effort === 'low' ? 'badge-effort-low' : 'badge-effort-medium'}`
          },
          `${act.effort} effort`
        )
      ),
      h(
        'h3',
        { style: { fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-2)' } },
        act.title
      ),
      h(
        'p',
        { style: { fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' } },
        act.why
      ),
      h(
        'details',
        { className: 'why-disclosure' },
        h('summary', {}, icon('info', { size: 14 }), i18n.components.whyThis),
        h('div', { className: 'disclosure-body' }, act.why)
      )
    )
  );

  const actionsSection = h(
    'section',
    {
      className: 'col-span-12',
      'aria-labelledby': 'priority-actions-heading',
      style: { marginTop: 'var(--space-2)' }
    },
    h(
      'h2',
      { id: 'priority-actions-heading', style: { marginBottom: 'var(--space-4)' } },
      i18n.today.recommendedActionsTitle
    ),
    h('div', { className: 'bento-grid' }, ...actionCards)
  );

  const viewGrid = h(
    'div',
    { className: 'bento-grid animate-fade-up' },
    heroCard,
    createTimelineStrip(hourly),
    actionsSection
  );

  mount(container, viewGrid);
}

// Backward compatibility helper
export const renderDashboard = (container, props) => renderTodayView(container, props);
