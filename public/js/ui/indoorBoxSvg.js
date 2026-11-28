/**
 * Inline SVG Diagram for DIY Corsi-Rosenthal Box Filter
 * Built strictly with DOM helpers (no innerHTML).
 */
import { h } from './dom.js';
import i18n from '../i18n/en.js';

/**
 * Creates the accessible inline SVG diagram showing 4 filters, top cover, and box fan.
 * @returns {SVGElement}
 */
export function createCorsiRosenthalSvg() {
  return /** @type {SVGElement} */ (
    h(
      'svg',
      {
        viewBox: '0 0 240 160',
        width: '240',
        height: '160',
        role: 'img',
        'aria-labelledby': 'cr-svg-title cr-svg-desc',
        style: { maxWidth: '100%', height: 'auto', display: 'block', marginBlock: 'var(--space-2)' }
      },
      h('title', { id: 'cr-svg-title' }, i18n.indoor.diySvgTitle),
      h('desc', { id: 'cr-svg-desc' }, i18n.indoor.diySvgDesc),
      // Cube base & 4 filter sides
      h('rect', {
        x: '60',
        y: '58',
        width: '120',
        height: '84',
        rx: '4',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2'
      }),
      h('line', {
        x1: '100',
        y1: '58',
        x2: '100',
        y2: '142',
        stroke: 'currentColor',
        'stroke-width': '1.5',
        'stroke-dasharray': '4 3'
      }),
      h('line', {
        x1: '140',
        y1: '58',
        x2: '140',
        y2: '142',
        stroke: 'currentColor',
        'stroke-width': '1.5',
        'stroke-dasharray': '4 3'
      }),
      // Top cover + box fan housing
      h('rect', {
        x: '52',
        y: '34',
        width: '136',
        height: '24',
        rx: '4',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2'
      }),
      h('circle', {
        cx: '120',
        cy: '46',
        r: '9',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '1.5'
      }),
      // Airflow arrows pointing up out of fan
      h('path', {
        d: 'M120 28 V10 M114 16 L120 10 L126 16',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2',
        'stroke-linecap': 'round'
      }),
      h(
        'text',
        { x: '120', y: '105', 'text-anchor': 'middle', 'font-size': '11', fill: 'currentColor' },
        '4x MERV-13 Filters'
      )
    )
  );
}
