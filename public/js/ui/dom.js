/**
 * Safe DOM Helpers
 * Never uses innerHTML with dynamic data; always uses createElement and textContent.
 */

/**
 * Creates an element with optional classes, attributes, and text.
 * @param {string} tag - HTML tag name.
 * @param {Object} [options]
 * @param {string[]} [options.classes]
 * @param {Record<string, string>} [options.attributes]
 * @param {string} [options.text]
 * @param {HTMLElement[]} [options.children]
 * @returns {HTMLElement}
 */
export function createElement(
  tag,
  { classes = [], attributes = {}, text = '', children = [] } = {}
) {
  const element = document.createElement(tag);

  if (classes.length > 0) {
    element.classList.add(...classes);
  }

  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
  }

  if (text) {
    element.textContent = text;
  }

  for (const child of children) {
    if (child instanceof Node) {
      element.appendChild(child);
    }
  }

  return element;
}

/**
 * Clears all children of a parent node safely.
 * @param {HTMLElement} element
 */
export function clearElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}
