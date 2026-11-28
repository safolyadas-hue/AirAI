/**
 * Today View - 24-Hour Timeline Strip & Stagnation Explanation
 */
import { h } from '../dom.js';
import i18n from '../../i18n/en.js';

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

function buildTimelineItem(item, bestTime, worstTime) {
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
}

/**
 * Builds the 24-hour timeline strip with text summary and stagnation explanation.
 * @param {Array<{ time: string, aqi: number }>} hourlyPoints
 * @param {{ bestWindow?: any, worstWindow?: any, stagnationRisk?: string } | null} hourlyAnalysis
 * @returns {HTMLElement}
 */
export function createTimelineSection(hourlyPoints = [], hourlyAnalysis = null) {
  const bestTime = hourlyAnalysis?.bestWindow?.time;
  const worstTime = hourlyAnalysis?.worstWindow?.time;
  const risk = hourlyAnalysis?.stagnationRisk || 'low';

  const strip = h(
    'div',
    {
      className: 'timeline-strip',
      tabindex: '0',
      role: 'region',
      'aria-label': i18n.today.timelineAriaLabel,
      onScroll: (e) => updateTimelineFade(/** @type {HTMLElement} */ (e.currentTarget))
    },
    ...hourlyPoints.slice(0, 24).map((pt) => buildTimelineItem(pt, bestTime, worstTime))
  );

  if (typeof requestAnimationFrame === 'function')
    requestAnimationFrame(() => updateTimelineFade(strip));
  else updateTimelineFade(strip);

  const windowText =
    hourlyAnalysis?.bestWindow && hourlyAnalysis?.worstWindow
      ? i18n.today.windowSummary
          .replace('{bestTime}', formatHourLabel(hourlyAnalysis.bestWindow.time))
          .replace('{bestAqi}', String(Math.round(hourlyAnalysis.bestWindow.aqi)))
          .replace('{worstTime}', formatHourLabel(hourlyAnalysis.worstWindow.time))
          .replace('{worstAqi}', String(Math.round(hourlyAnalysis.worstWindow.aqi)))
      : '';

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
        i18n.today.stagnationExplain[risk] || i18n.today.stagnationExplain.low
      )
    ),
    strip
  );
}
