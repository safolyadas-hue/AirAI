import { describe, it, expect } from 'vitest';

/**
 * Calculates sRGB relative luminance per WCAG 2.1 specs.
 * Formula: https://www.w3.org/WAI/GL/wiki/Relative_luminance
 * @param {string} hex - 6-character hex string (e.g. '#ffffff')
 * @returns {number} Relative luminance (0 to 1)
 */
export function getRelativeLuminance(hex) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.slice(0, 2), 16) / 255;
  const g = parseInt(cleanHex.slice(2, 4), 16) / 255;
  const b = parseInt(cleanHex.slice(4, 6), 16) / 255;

  const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

  const rLinear = toLinear(r);
  const gLinear = toLinear(g);
  const bLinear = toLinear(b);

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Calculates WCAG contrast ratio between two hex colors.
 * @param {string} hex1 - First color hex.
 * @param {string} hex2 - Second color hex.
 * @returns {number} Contrast ratio (1.0 to 21.0).
 */
export function getContrastRatio(hex1, hex2) {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 100) / 100;
}

describe('WCAG AA Contrast Ratio Compliance', () => {
  const LIGHT_SURFACE = '#ffffff';
  const LIGHT_TEXT = '#0f172a';
  const LIGHT_TEXT_MUTED = '#475569';

  const DARK_SURFACE = '#131b2e';
  const DARK_TEXT = '#f8fafc';
  const DARK_TEXT_MUTED = '#94a3b8';

  const THEMES_LIGHT = {
    good: { accent: '#0a6c42', contrastText: '#ffffff' },
    moderate: { accent: '#785100', contrastText: '#ffffff' },
    usg: { accent: '#9e3f00', contrastText: '#ffffff' },
    unhealthy: { accent: '#b91c1c', contrastText: '#ffffff' },
    'very-unhealthy': { accent: '#6b21a8', contrastText: '#ffffff' },
    hazardous: { accent: '#831843', contrastText: '#ffffff' }
  };

  const THEMES_DARK = {
    good: { accent: '#34d399', contrastText: '#0b111e' },
    moderate: { accent: '#fbbf24', contrastText: '#0b111e' },
    usg: { accent: '#fb923c', contrastText: '#0b111e' },
    unhealthy: { accent: '#f87171', contrastText: '#0b111e' },
    'very-unhealthy': { accent: '#c084fc', contrastText: '#0b111e' },
    hazardous: { accent: '#fb7185', contrastText: '#0b111e' }
  };

  describe('Light Mode Base Surfaces', () => {
    it('main text meets WCAG AAA (> 7.0:1) on white surface', () => {
      const ratio = getContrastRatio(LIGHT_TEXT, LIGHT_SURFACE);
      expect(ratio).toBeGreaterThanOrEqual(7.0);
    });

    it('muted text meets WCAG AA (> 4.5:1) on white surface', () => {
      const ratio = getContrastRatio(LIGHT_TEXT_MUTED, LIGHT_SURFACE);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('every light mode AQI accent meets WCAG AA (> 4.5:1) on white surface', () => {
      for (const [theme, colors] of Object.entries(THEMES_LIGHT)) {
        const ratio = getContrastRatio(colors.accent, LIGHT_SURFACE);
        expect(
          ratio,
          `Theme "${theme}" accent ${colors.accent} failed WCAG AA on white`
        ).toBeGreaterThanOrEqual(4.5);
      }
    });

    it('button white text meets WCAG AA (> 4.5:1) on every light accent button', () => {
      for (const [theme, colors] of Object.entries(THEMES_LIGHT)) {
        const ratio = getContrastRatio(colors.contrastText, colors.accent);
        expect(
          ratio,
          `Theme "${theme}" white text failed on accent button ${colors.accent}`
        ).toBeGreaterThanOrEqual(4.5);
      }
    });
  });

  describe('Dark Mode Base Surfaces', () => {
    it('main text meets WCAG AAA (> 7.0:1) on dark surface', () => {
      const ratio = getContrastRatio(DARK_TEXT, DARK_SURFACE);
      expect(ratio).toBeGreaterThanOrEqual(7.0);
    });

    it('muted text meets WCAG AA (> 4.5:1) on dark surface', () => {
      const ratio = getContrastRatio(DARK_TEXT_MUTED, DARK_SURFACE);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('every dark mode AQI accent meets WCAG AA (> 4.5:1) on dark surface', () => {
      for (const [theme, colors] of Object.entries(THEMES_DARK)) {
        const ratio = getContrastRatio(colors.accent, DARK_SURFACE);
        expect(
          ratio,
          `Theme "${theme}" dark accent ${colors.accent} failed WCAG AA on dark surface`
        ).toBeGreaterThanOrEqual(4.5);
      }
    });

    it('button dark text meets WCAG AA (> 4.5:1) on every dark accent button', () => {
      for (const [theme, colors] of Object.entries(THEMES_DARK)) {
        const ratio = getContrastRatio(colors.contrastText, colors.accent);
        expect(
          ratio,
          `Theme "${theme}" text failed on dark accent button ${colors.accent}`
        ).toBeGreaterThanOrEqual(4.5);
      }
    });
  });
});
