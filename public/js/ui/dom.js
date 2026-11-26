/**
 * Safe DOM Builder Utility
 * Guarantees zero innerHTML usage; uses createElement, createTextNode, and textContent exclusively.
 */

const SVG_TAGS = new Set([
  'svg',
  'path',
  'circle',
  'rect',
  'line',
  'polyline',
  'polygon',
  'g',
  'text',
  'defs',
  'linearGradient',
  'radialGradient',
  'stop',
  'title',
  'desc'
]);

/**
 * Creates a DOM or SVG element safely with attributes and children.
 * @param {string} tag - HTML or SVG tag name.
 * @param {Record<string, any>} [attrs={}] - Attributes, dataset, aria, or event handlers.
 * @param {...(Node | string | number | null | undefined | Array<Node | string>)} children - Child nodes or text.
 * @returns {HTMLElement | SVGElement}
 */
export function h(tag, attrs = {}, ...children) {
  const isSvg = SVG_TAGS.has(tag);
  const el = isSvg
    ? document.createElementNS('http://www.w3.org/2000/svg', tag)
    : document.createElement(tag);

  if (attrs && typeof attrs === 'object') {
    for (const [key, val] of Object.entries(attrs)) {
      if (val === undefined || val === null) continue;

      if (key === 'className' || key === 'class') {
        const cls = String(val).trim();
        if (cls) {
          if (isSvg) {
            el.setAttribute('class', cls);
          } else {
            el.className = cls;
          }
        }
      } else if (key === 'dataset' && typeof val === 'object') {
        for (const [dKey, dVal] of Object.entries(val)) {
          if (dVal !== undefined && dVal !== null) {
            /** @type {HTMLElement} */ (el).dataset[dKey] = String(dVal);
          }
        }
      } else if (key.startsWith('on') && typeof val === 'function') {
        const eventName = key.slice(2).toLowerCase();
        el.addEventListener(eventName, val);
      } else if (key === 'on' && typeof val === 'object') {
        for (const [evt, handler] of Object.entries(val)) {
          if (typeof handler === 'function') {
            el.addEventListener(evt, handler);
          }
        }
      } else if (key === 'style' && typeof val === 'object') {
        for (const [sKey, sVal] of Object.entries(val)) {
          /** @type {HTMLElement} */ (el).style[sKey] = String(sVal);
        }
      } else if (typeof val === 'boolean') {
        if (val) {
          el.setAttribute(key, '');
        }
      } else {
        el.setAttribute(key, String(val));
      }
    }
  }

  appendChildren(el, children);
  return el;
}

/**
 * Appends mixed children (nodes, strings, arrays) into a parent safely using text nodes.
 * @param {Node} parent
 * @param {Array<any>} children
 */
function appendChildren(parent, children) {
  for (const child of children) {
    if (child === undefined || child === null || child === false) {
      continue;
    }
    if (Array.isArray(child)) {
      appendChildren(parent, child);
    } else if (child instanceof Node) {
      parent.appendChild(child);
    } else {
      parent.appendChild(document.createTextNode(String(child)));
    }
  }
}

/**
 * Safely removes all child nodes from a container element.
 * @param {Node} node
 */
export function clear(node) {
  if (!node) return;
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

/**
 * Mounts one or more children into a parent node.
 * @param {Node} parent
 * @param {...(Node | string | Array<Node | string>)} children
 * @returns {Node} Parent node for chaining.
 */
export function mount(parent, ...children) {
  if (parent) {
    appendChildren(parent, children);
  }
  return parent;
}
