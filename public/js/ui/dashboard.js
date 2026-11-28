/**
 * Today / Air Quality Dashboard View
 * Renders live circular AQI gauge, pollutant tiles, 24-hr timeline with stagnation explanation,
 * and top 3 priority actions. Purely render-only.
 */
import { h, clear, mount } from './dom.js';
import { icon } from './icons.js';
import i18n from '../i18n/en.js';

/**
 * Formats relative time since last update.
 * @param {number | null} lastUpdatedAt
 * @returns {string}
 */
function formatRelativeUpdated(lastUpdatedAt) {
  if (!lastUpdatedAt) return i18n.status.updatedJustNow;
  const diffMin = Math.max(0, Math.floor((Date.now() - lastUpdatedAt) / 60000));
  if (diffMin < 1) return i18n.status.updatedJustNow;
  if (diffMin < 60) return i18n.status.updatedMinutesAgo.replace('{min}', String(diffMin));
  const diffHr = Math.floor(diffMin / 60);
  return i18n.status.updatedHoursAgo.replace('{hr}', String(diffHr));
}

/**
 * Formats a time string (ISO or HH:MM) to compact HH:MM.
 * @param {string} rawTime
 * @returns {string}
 */
function formatHourLabel(rawTime) {
  if (!rawTime) return '';
  const match = String(rawTime).match(/(\d{2}:\d{2})/);
  return match ? match[1] : String(rawTime);
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
 * Builds the 4-pollutant readout row inside the hero card.
 * @param {Record<string, number | undefined>} airSnapshot
 * @param {string} dominantPollutant
 * @returns {HTMLElement}
 */
function createPollutantRow(airSnapshot, dominantPollutant) {
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

/**
 * Updates horizontal overflow fade classes on the timeline strip based on scroll position.
 * @param {HTMLElement | null} stripEl
 */
export function updateTimelineFade(stripEl) {
  if (!stripEl) return;
  const threshold = 2;
  const hasLeft = stripEl.scrollLeft > threshold;
  const hasRight = stripEl.scrollLeft + stripEl.clientWidth < stripEl.scrollWidth - threshold;
  stripEl.classList.toggle('has-overflow-left', hasLeft);
  stripEl.classList.toggle('has-overflow-right', hasRight);
}

/**
 * Builds the 24-hour timeline strip with text summary and stagnation explanation.
 * @param {Array<{ time: string, aqi: number }>} hourlyPoints
 * @param {{ bestWindow?: any, worstWindow?: any, stagnationRisk?: string } | null} hourlyAnalysis
 * @returns {HTMLElement}
 */
function createTimelineSection(hourlyPoints = [], hourlyAnalysis = null) {
  const bestTime = hourlyAnalysis?.bestWindow?.time;
  const worstTime = hourlyAnalysis?.worstWindow?.time;
  const risk = hourlyAnalysis?.stagnationRisk || 'low';

  const items = hourlyPoints.slice(0, 24).map((item) => {
    const isBest = bestTime !== undefined && item.time === bestTime;
    const isWorst = worstTime !== undefined && item.time === worstTime;

    return h(
      'div',
      { className: `timeline-hour ${isBest ? 'is-best' : ''}` },
      h(
        'span',
        { style: { fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' } },
        formatHourLabel(item.time)
      ),
      h(
        'strong',
        { className: 'tabular-nums', style: { fontSize: 'var(--font-size-sm)' } },
        `${Math.round(item.aqi)}`
      ),
      isBest || isWorst
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

  const strip = h(
    'div',
    {
      className: 'timeline-strip',
      tabindex: '0',
      role: 'region',
      'aria-label': i18n.today.timelineAriaLabel,
      onScroll: (e) => updateTimelineFade(/** @type {HTMLElement} */ (e.currentTarget))
    },
    ...items
  );

  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => updateTimelineFade(strip));
  } else {
    updateTimelineFade(strip);
  }

  const windowText =
    hourlyAnalysis?.bestWindow && hourlyAnalysis?.worstWindow
      ? i18n.today.windowSummary
          .replace('{bestTime}', formatHourLabel(hourlyAnalysis.bestWindow.time))
          .replace('{bestAqi}', String(Math.round(hourlyAnalysis.bestWindow.aqi)))
          .replace('{worstTime}', formatHourLabel(hourlyAnalysis.worstWindow.time))
          .replace('{worstAqi}', String(Math.round(hourlyAnalysis.worstWindow.aqi)))
      : '';

  const stagnationText = i18n.today.stagnationExplain[risk] || i18n.today.stagnationExplain.low;

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
      ),
      windowText
        ? h(
            'p',
            { style: { fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-1)' } },
            windowText
          )
        : null,
      h(
        'p',
        { style: { fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' } },
        stagnationText
      )
    ),
    strip
  );
}

/**
 * Renders the Today dashboard view from live application state.
 * @param {HTMLElement} container
 * @param {object} props
 */
export function renderTodayView(
  container,
  {
    status = 'idle',
    air = null,
    hourly = null,
    rules = null,
    advice = null,
    adviceStatus = 'idle',
    categoryKey = 'unhealthy',
    categoryLabel = 'Unhealthy',
    lastUpdatedAt = null,
    onRefresh = () => {},
    onRetry = () => {}
  } = {}
) {
  clear(container);

  if (status === 'loading') {
    mount(
      container,
      h(
        'div',
        { className: 'bento-grid' },
        h(
          'div',
          { className: 'card col-span-12', role: 'status', 'aria-live': 'polite' },
          h('div', {
            className: 'skeleton-shimmer',
            style: { height: '140px', marginBottom: 'var(--space-3)' }
          }),
          h(
            'p',
            { style: { color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' } },
            i18n.status.loadingAir
          )
        )
      )
    );
    return;
  }

  if (status === 'error' || !air || !rules) {
    mount(
      container,
      h(
        'div',
        { className: 'bento-grid' },
        h(
          'div',
          { className: 'card card-raised col-span-12', role: 'alert' },
          h('h2', {}, i18n.status.errorTitle),
          h(
            'p',
            { style: { color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' } },
            i18n.status.errorBody
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'btn btn-primary',
              style: { marginTop: 'var(--space-3)' },
              onClick: onRetry
            },
            icon('refresh', { size: 16 }),
            i18n.status.retryButton
          )
        )
      )
    );
    return;
  }

  const snapshot = air.airSnapshot;
  const aqi = snapshot.aqi;
  const domKey = snapshot.dominantPollutant?.pollutant || 'pm2_5';
  const headlineText = advice?.summary || rules.headline || i18n.today.riskBannerTitle;
  const topActions = (rules.actions || []).slice(0, 3);

  const aiNote =
    adviceStatus === 'loading'
      ? h('div', {
          className: 'skeleton-shimmer',
          style: { height: '18px', width: '60%' },
          'aria-label': i18n.status.aiLoading
        })
      : adviceStatus === 'fallback' || adviceStatus === 'error'
        ? h(
            'p',
            { style: { fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' } },
            i18n.status.rulesOnlyNote
          )
        : null;

  const heroCard = h(
    'div',
    { className: 'hero-card col-span-12' },
    h('div', { className: 'hero-haze-layer', 'aria-hidden': 'true' }),
    h('div', { className: 'hero-haze-layer hero-haze-layer-2', 'aria-hidden': 'true' }),
    h(
      'div',
      { className: 'hero-content' },
      createAqiGauge(aqi, categoryLabel, domKey),
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
            `${i18n.hero.dominantPrefix} ${domKey.toUpperCase().replace('_', '.')}`
          )
        ),
        h('h2', { style: { marginTop: 'var(--space-1)' } }, headlineText),
        aiNote,
        createPollutantRow(snapshot, domKey),
        h(
          'div',
          {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              flexWrap: 'wrap'
            }
          },
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
        )
      )
    )
  );

  const actionCards = topActions.map((act) =>
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

  mount(
    container,
    h(
      'div',
      { className: 'bento-grid animate-fade-up' },
      heroCard,
      createTimelineSection(air.hourly, hourly),
      actionsSection
    )
  );
}

export const renderDashboard = (container, props) => renderTodayView(container, props);
