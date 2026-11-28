/**
 * Impact What-If - Before/After Indoor PM2.5 Inline SVG Bar Chart & Accessible Data Table
 */
import { h } from '../dom.js';
import i18n from '../../i18n/en.js';

function createChartTable(chartData) {
  return h(
    'details',
    { className: 'why-disclosure', style: { marginTop: 'var(--space-3)' } },
    h('summary', {}, i18n.impact.chartTableToggle),
    h(
      'div',
      { className: 'disclosure-body' },
      h(
        'table',
        {
          style: {
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: 'var(--font-size-sm)'
          }
        },
        h(
          'thead',
          {},
          h(
            'tr',
            {},
            h('th', {}, 'Scenario'),
            h('th', {}, 'Midpoint (µg/m³)'),
            h('th', {}, 'Range (µg/m³)')
          )
        ),
        h(
          'tbody',
          {},
          h(
            'tr',
            {},
            h('td', {}, i18n.impact.chartWithoutLabel),
            h('td', {}, String(chartData.baselineMid)),
            h('td', {}, `${chartData.baselineLow}–${chartData.baselineHigh}`)
          ),
          h(
            'tr',
            {},
            h('td', {}, i18n.impact.chartWithLabel),
            h('td', {}, String(chartData.withActionsMid)),
            h('td', {}, `${chartData.withActionsLow}–${chartData.withActionsHigh}`)
          ),
          h(
            'tr',
            {},
            h('td', {}, i18n.impact.chartWhoLabel),
            h('td', {}, String(chartData.whoGuideline)),
            h('td', {}, String(chartData.whoGuideline))
          )
        )
      )
    )
  );
}

function createBarGroup(x, mid, low, high, label, fill, stroke, scaleY) {
  const y = scaleY(mid);
  return [
    h('rect', {
      x: String(x),
      y: String(y),
      width: '76',
      height: String(140 - y),
      rx: '4',
      fill,
      stroke: stroke || 'none',
      'stroke-width': stroke ? '1.5' : '0'
    }),
    h('line', {
      x1: String(x + 38),
      y1: String(scaleY(high)),
      x2: String(x + 38),
      y2: String(scaleY(low)),
      stroke: 'currentColor',
      'stroke-width': '2'
    }),
    h(
      'text',
      {
        x: String(x + 38),
        y: String(Math.max(14, y - 6)),
        'text-anchor': 'middle',
        'font-size': '11',
        fill: 'currentColor'
      },
      `${mid} µg/m³`
    ),
    h(
      'text',
      {
        x: String(x + 38),
        y: '158',
        'text-anchor': 'middle',
        'font-size': '11',
        fill: 'currentColor'
      },
      label
    )
  ];
}

function createChartDefsAndAxes(whoY) {
  return [
    h(
      'defs',
      {},
      h(
        'pattern',
        {
          id: 'bar-hatch',
          width: '6',
          height: '6',
          patternUnits: 'userSpaceOnUse',
          patternTransform: 'rotate(45)'
        },
        h('line', {
          x1: '0',
          y1: '0',
          x2: '0',
          y2: '6',
          stroke: 'currentColor',
          'stroke-width': '1.5',
          'stroke-opacity': '0.35'
        })
      )
    ),
    h('line', {
      x1: '36',
      y1: '140',
      x2: '330',
      y2: '140',
      stroke: 'currentColor',
      'stroke-opacity': '0.3'
    }),
    h('line', {
      x1: '36',
      y1: String(whoY),
      x2: '330',
      y2: String(whoY),
      stroke: 'var(--color-danger)',
      'stroke-width': '1.5',
      'stroke-dasharray': '5 3'
    }),
    h(
      'text',
      {
        x: '328',
        y: String(Math.max(12, whoY - 4)),
        'text-anchor': 'end',
        'font-size': '10',
        fill: 'var(--color-danger)'
      },
      i18n.impact.chartWhoLabel
    )
  ];
}

function buildChartSvg(chartData) {
  const maxVal = Math.max(chartData.baselineHigh, chartData.whoGuideline, 25);
  const scaleY = (v) => Math.round(140 - (v / maxVal) * 110);
  const descText = `${i18n.impact.chartWithoutLabel}: ${chartData.baselineLow} to ${chartData.baselineHigh} µg/m³ (midpoint ${chartData.baselineMid}). ${i18n.impact.chartWithLabel}: ${chartData.withActionsLow} to ${chartData.withActionsHigh} µg/m³ (midpoint ${chartData.withActionsMid}). ${i18n.impact.chartWhoLabel}.`;

  return h(
    'svg',
    {
      viewBox: '0 0 360 175',
      role: 'img',
      'aria-labelledby': 'impact-chart-title impact-chart-desc',
      style: { width: '100%', maxWidth: '460px', height: 'auto', display: 'block' }
    },
    h(
      'title',
      { id: 'impact-chart-title' },
      `${i18n.impact.chartTitle} (${i18n.impact.chartBadge})`
    ),
    h('desc', { id: 'impact-chart-desc' }, descText),
    ...createChartDefsAndAxes(scaleY(chartData.whoGuideline)),
    ...createBarGroup(
      70,
      chartData.baselineMid,
      chartData.baselineLow,
      chartData.baselineHigh,
      i18n.impact.chartWithoutLabel,
      'url(#bar-hatch)',
      'currentColor',
      scaleY
    ),
    ...createBarGroup(
      210,
      chartData.withActionsMid,
      chartData.withActionsLow,
      chartData.withActionsHigh,
      i18n.impact.chartWithLabel,
      'var(--accent-fill)',
      null,
      scaleY
    )
  );
}

/**
 * Builds the illustrative Before/After SVG bar chart and table fallback.
 * @param {any} chartData
 * @returns {HTMLElement}
 */
export function createBeforeAfterChart(chartData) {
  return h(
    'div',
    { className: 'card col-span-12' },
    h(
      'div',
      {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-2)',
          flexWrap: 'wrap',
          gap: 'var(--space-2)'
        }
      },
      h('h3', { style: { fontSize: 'var(--font-size-md)' } }, i18n.impact.chartTitle),
      h('span', { className: 'badge chip-accent' }, i18n.impact.chartBadge)
    ),
    buildChartSvg(chartData),
    createChartTable(chartData)
  );
}
