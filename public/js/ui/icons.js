/**
 * Inline SVG Icon Library
 * Lightweight SVG paths built safely with DOM helpers, zero external font or image assets.
 */
import { h } from './dom.js';

/**
 * Standard SVG Path definitions for CleanAir Companion icons.
 */
const ICON_PATHS = {
  wind: 'M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2',
  mask: 'M4 7c0-1.1.9-2 2-2h12a2 2 0 0 1 2 2v6a7 7 0 0 1-7 7H11a7 7 0 0 1-7-7V7zM2 9h2m16 0h2',
  home: 'm3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  leaf: 'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z',
  bike: 'M5.5 17.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm13 0a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM12 17.5V14l3-3 3.5 1M9 11l3-4h3',
  bus: 'M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1l-1 2H7l-1-2H5a2 2 0 0 1-2-2V6Zm0 5h16M7 15h.01M17 15h.01',
  flame:
    'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z',
  clock: 'M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  chat: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  sun: 'M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z',
  moon: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z',
  monitor:
    'M20 3H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm-8 14v4m-4 0h8',
  location:
    'M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8Zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z',
  info: 'M12 16v-4m0-4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  check: 'm5 12 5 5L20 7',
  alert:
    'M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
  refresh:
    'M23 4v6h-6M1 20v-6h6m-3.8-2a9 9 0 0 1 14.85-3.36L23 10M1 14l4.95 1.36A9 9 0 0 0 20.8 12',
  chevron: 'm6 9 6 6 6-6',
  // AQI Category Icons
  'aqi-good': 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4',
  'aqi-moderate': 'M12 8v4m0 4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  'aqi-usg':
    'M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
  'aqi-unhealthy': 'M18 6 6 18M6 6l12 12',
  'aqi-very-unhealthy': 'M12 2v20m10-10H2m17.07-7.07-14.14 14.14m0-14.14 14.14 14.14',
  'aqi-hazardous':
    'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm-3 7a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm-7 7c1-1.5 3-2 4-2s3 .5 4 2'
};

/**
 * Creates an accessible SVG icon element.
 * @param {string} name - Registered icon name.
 * @param {Object} [options={}] - Configurable icon options.
 * @param {string} [options.label] - Accessible description. If omitted, icon is aria-hidden.
 * @param {number} [options.size=20] - Dimensions in pixels.
 * @param {string} [options.className=''] - Additional CSS classes.
 * @returns {SVGElement}
 */
export function icon(name, { label = '', size = 20, className = '' } = {}) {
  const pathD = ICON_PATHS[name] || ICON_PATHS.info;

  const attrs = {
    viewBox: '0 0 24 24',
    width: size,
    height: size,
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    className: `icon icon-${name} ${className}`.trim()
  };

  if (label) {
    attrs.role = 'img';
    attrs['aria-label'] = label;
  } else {
    attrs['aria-hidden'] = 'true';
  }

  const children = [h('path', { d: pathD })];
  if (label) {
    children.unshift(h('title', {}, label));
  }

  return /** @type {SVGElement} */ (h('svg', attrs, ...children));
}

// Backward compatibility helper
export const createIcon = (name, color = 'currentColor', size = 24) => {
  const el = icon(name, { size });
  el.style.stroke = color;
  return el;
};
