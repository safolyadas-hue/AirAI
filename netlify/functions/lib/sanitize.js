/**
 * Sanitization Utilities for Generative AI Outputs
 * Converts LaTeX expressions to plain text, removes math markup, HTML tags, and control characters.
 */

/**
 * Sanitizes model-generated text by converting common LaTeX patterns to plain text,
 * stripping math delimiters, HTML tags, and control characters.
 * @param {unknown} input - Raw text or value from model.
 * @returns {string} Sanitized plain text.
 */
export function cleanModelText(input) {
  if (typeof input !== 'string') {
    return typeof input === 'number' || typeof input === 'boolean' ? String(input) : '';
  }

  let text = input;

  // 1. Convert LaTeX \text{...}, \mathrm{...}, \mathbf{...} to inner content
  while (/\\(?:text|mathrm|mathbf|mathit)\{([^}]*)\}/.test(text)) {
    text = text.replace(/\\(?:text|mathrm|mathbf|mathit)\{([^}]*)\}/g, '$1');
  }

  // 2. Convert common LaTeX units and symbols
  text = text.replace(/\\mu\s*g\/m\^?\{?3\}?/gi, 'µg/m³');
  text = text.replace(/\\mu\s*g/gi, 'µg');
  text = text.replace(/\\times\b/g, '×');
  text = text.replace(/\\pm\b/g, '±');
  text = text.replace(/\\le(q)?\b/g, '≤');
  text = text.replace(/\\ge(q)?\b/g, '≥');
  text = text.replace(/\\(?:circ|degree)\b/g, '°');

  // 3. Convert subscripts and superscripts: _{2.5} -> 2.5, ^{3} -> 3, _2 -> 2
  text = text.replace(/_\{([^}]*)\}/g, '$1');
  text = text.replace(/\^\{([^}]*)\}/g, '$1');
  text = text.replace(/_([0-9]+(?:\.[0-9]+)?)/g, '$1');

  // 4. Remove math block and inline delimiters: $$, $, \[, \], \(, \)
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, '$1');
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, '$1');
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, '$1');
  text = text.replace(/\$([^$\n]+)\$/g, '$1');
  text = text.replace(/\$/g, '');

  // 5. Clean any residual LaTeX commands (\text, spacing)
  text = text.replace(/\\text\b/g, '');
  text = text.replace(/\\(?:quad|qquad|thickspace|thinspace|enspace)\b/g, ' ');

  // 6. Strip HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // 7. Strip control characters (preserve newline and tab)
  // eslint-disable-next-line no-control-regex
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return text.trim();
}

/**
 * Recursively cleans all string fields in an object or array payload.
 * @param {any} val - Structured object, array, or primitive.
 * @returns {any} Sanitized payload with all strings cleaned.
 */
export function sanitizeModelPayload(val) {
  if (typeof val === 'string') {
    return cleanModelText(val);
  }
  if (Array.isArray(val)) {
    return val.map((item) => sanitizeModelPayload(item));
  }
  if (val && typeof val === 'object') {
    const cleaned = {};
    for (const [k, v] of Object.entries(val)) {
      cleaned[k] = sanitizeModelPayload(v);
    }
    return cleaned;
  }
  return val;
}
