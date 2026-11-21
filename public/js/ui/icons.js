/**
 * Inline SVG Icon Builders
 * Lightweight, zero external requests, supports theme colors.
 */

/**
 * Creates an inline SVG element for an icon.
 * @param {'leaf' | 'wind' | 'mask' | 'shield' | 'car' | 'user'} name
 * @param {string} [color='currentColor']
 * @param {number} [size=24]
 * @returns {SVGElement}
 */
export function createIcon(name, color = 'currentColor', size = 24) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', color);
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

  switch (name) {
    case 'wind':
      path.setAttribute(
        'd',
        'M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2'
      );
      break;
    case 'mask':
      path.setAttribute(
        'd',
        'M4 7c0-1.1.9-2 2-2h12a2 2 0 0 1 2 2v6a7 7 0 0 1-7 7H11a7 7 0 0 1-7-7V7z'
      );
      break;
    case 'shield':
      path.setAttribute('d', 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z');
      break;
    case 'leaf':
    default:
      path.setAttribute(
        'd',
        'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z'
      );
      break;
  }

  svg.appendChild(path);
  return svg;
}
