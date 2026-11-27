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

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Alpha-composites a foreground hex + alpha over an opaque background hex.
 * @param {string} fgHex
 * @param {number} alpha
 * @param {string} bgHex
 * @returns {string}
 */
export function compositeOver(fgHex, alpha, bgHex) {
  const parse = (h) => {
    const c = h.replace('#', '');
    return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
  };
  const [fr, fg, fb] = parse(fgHex);
  const [br, bg, bb] = parse(bgHex);
  const mix = (f, b) =>
    Math.round(f * alpha + b * (1 - alpha))
      .toString(16)
      .padStart(2, '0');
  return `#${mix(fr, br)}${mix(fg, bg)}${mix(fb, bb)}`;
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
  const LIGHT_SURFACE_RAISED = '#ffffff';
  const LIGHT_TEXT = '#0f172a';
  const LIGHT_TEXT_MUTED = '#475569';

  const DARK_SURFACE = '#131b2e';
  const DARK_SURFACE_RAISED = '#1a243b';
  const DARK_TEXT = '#f8fafc';
  const DARK_TEXT_MUTED = '#94a3b8';

  const THEMES_LIGHT = {
    good: {
      accentText: '#0a6c42',
      accentFill: '#0a6c42',
      onAccent: '#ffffff',
      accentSoft: '#eaf7f0',
      chipBg: compositeOver('#0a6c42', 0.12, LIGHT_SURFACE),
      chipText: '#054429',
      heroStops: ['#eaf7f0', '#f8fafc']
    },
    moderate: {
      accentText: '#785100',
      accentFill: '#785100',
      onAccent: '#ffffff',
      accentSoft: '#fef8e7',
      chipBg: compositeOver('#785100', 0.12, LIGHT_SURFACE),
      chipText: '#523700',
      heroStops: ['#fef8e7', '#f8fafc']
    },
    usg: {
      accentText: '#9e3f00',
      accentFill: '#9e3f00',
      onAccent: '#ffffff',
      accentSoft: '#fff2e8',
      chipBg: compositeOver('#9e3f00', 0.12, LIGHT_SURFACE),
      chipText: '#662800',
      heroStops: ['#fff2e8', '#f8fafc']
    },
    unhealthy: {
      accentText: '#b91c1c',
      accentFill: '#b91c1c',
      onAccent: '#ffffff',
      accentSoft: '#fef2f2',
      chipBg: compositeOver('#b91c1c', 0.12, LIGHT_SURFACE),
      chipText: '#7f1d1d',
      heroStops: ['#fef2f2', '#f8fafc']
    },
    'very-unhealthy': {
      accentText: '#6b21a8',
      accentFill: '#6b21a8',
      onAccent: '#ffffff',
      accentSoft: '#faf5ff',
      chipBg: compositeOver('#6b21a8', 0.12, LIGHT_SURFACE),
      chipText: '#4c1d95',
      heroStops: ['#faf5ff', '#f8fafc']
    },
    hazardous: {
      accentText: '#831843',
      accentFill: '#831843',
      onAccent: '#ffffff',
      accentSoft: '#fdf2f8',
      chipBg: compositeOver('#831843', 0.12, LIGHT_SURFACE),
      chipText: '#500724',
      heroStops: ['#fdf2f8', '#f8fafc']
    }
  };

  const THEMES_DARK = {
    good: {
      accentText: '#34d399',
      accentFill: '#34d399',
      onAccent: '#0b111e',
      accentSoft: compositeOver('#34d399', 0.15, DARK_SURFACE),
      chipBg: compositeOver('#34d399', 0.18, DARK_SURFACE),
      chipText: '#6ee7b7',
      heroStops: [compositeOver('#064e3b', 0.35, DARK_SURFACE), DARK_SURFACE]
    },
    moderate: {
      accentText: '#fbbf24',
      accentFill: '#fbbf24',
      onAccent: '#0b111e',
      accentSoft: compositeOver('#fbbf24', 0.15, DARK_SURFACE),
      chipBg: compositeOver('#fbbf24', 0.18, DARK_SURFACE),
      chipText: '#fcd34d',
      heroStops: [compositeOver('#785100', 0.35, DARK_SURFACE), DARK_SURFACE]
    },
    usg: {
      accentText: '#fb923c',
      accentFill: '#fb923c',
      onAccent: '#0b111e',
      accentSoft: compositeOver('#fb923c', 0.15, DARK_SURFACE),
      chipBg: compositeOver('#fb923c', 0.18, DARK_SURFACE),
      chipText: '#fdba74',
      heroStops: [compositeOver('#9e3f00', 0.35, DARK_SURFACE), DARK_SURFACE]
    },
    unhealthy: {
      accentText: '#f87171',
      accentFill: '#f87171',
      onAccent: '#0b111e',
      accentSoft: compositeOver('#f87171', 0.15, DARK_SURFACE),
      chipBg: compositeOver('#f87171', 0.18, DARK_SURFACE),
      chipText: '#fca5a5',
      heroStops: [compositeOver('#b91c1c', 0.35, DARK_SURFACE), DARK_SURFACE]
    },
    'very-unhealthy': {
      accentText: '#c084fc',
      accentFill: '#c084fc',
      onAccent: '#0b111e',
      accentSoft: compositeOver('#c084fc', 0.15, DARK_SURFACE),
      chipBg: compositeOver('#c084fc', 0.18, DARK_SURFACE),
      chipText: '#d8b4fe',
      heroStops: [compositeOver('#6b21a8', 0.35, DARK_SURFACE), DARK_SURFACE]
    },
    hazardous: {
      accentText: '#fb7185',
      accentFill: '#fb7185',
      onAccent: '#0b111e',
      accentSoft: compositeOver('#fb7185', 0.15, DARK_SURFACE),
      chipBg: compositeOver('#fb7185', 0.18, DARK_SURFACE),
      chipText: '#fda4af',
      heroStops: [compositeOver('#831843', 0.35, DARK_SURFACE), DARK_SURFACE]
    }
  };

  describe('Light Mode Surfaces & Token Roles', () => {
    it('main and muted text meet WCAG AA/AAA on light surface', () => {
      expect(getContrastRatio(LIGHT_TEXT, LIGHT_SURFACE)).toBeGreaterThanOrEqual(7.0);
      expect(getContrastRatio(LIGHT_TEXT_MUTED, LIGHT_SURFACE)).toBeGreaterThanOrEqual(4.5);
    });

    it('every light category passes all token-role contrast pairs (>= 4.5:1)', () => {
      for (const [theme, c] of Object.entries(THEMES_LIGHT)) {
        expect(
          getContrastRatio(c.accentText, LIGHT_SURFACE),
          `${theme} accentText/surface`
        ).toBeGreaterThanOrEqual(4.5);
        expect(
          getContrastRatio(c.accentText, LIGHT_SURFACE_RAISED),
          `${theme} accentText/raised`
        ).toBeGreaterThanOrEqual(4.5);
        expect(
          getContrastRatio(c.accentText, c.accentSoft),
          `${theme} accentText/soft`
        ).toBeGreaterThanOrEqual(4.5);
        expect(
          getContrastRatio(c.onAccent, c.accentFill),
          `${theme} onAccent/accentFill`
        ).toBeGreaterThanOrEqual(4.5);
        expect(
          getContrastRatio(c.chipText, c.chipBg),
          `${theme} chipText/chipBg`
        ).toBeGreaterThanOrEqual(4.5);
        for (const stop of c.heroStops) {
          expect(
            getContrastRatio(LIGHT_TEXT, stop),
            `${theme} hero text/${stop}`
          ).toBeGreaterThanOrEqual(4.5);
        }
      }
    });
  });

  describe('Dark Mode Surfaces & Token Roles', () => {
    it('main and muted text meet WCAG AA/AAA on dark surface', () => {
      expect(getContrastRatio(DARK_TEXT, DARK_SURFACE)).toBeGreaterThanOrEqual(7.0);
      expect(getContrastRatio(DARK_TEXT_MUTED, DARK_SURFACE)).toBeGreaterThanOrEqual(4.5);
    });

    it('every dark category passes all token-role contrast pairs (>= 4.5:1)', () => {
      for (const [theme, c] of Object.entries(THEMES_DARK)) {
        expect(
          getContrastRatio(c.accentText, DARK_SURFACE),
          `${theme} accentText/surface`
        ).toBeGreaterThanOrEqual(4.5);
        expect(
          getContrastRatio(c.accentText, DARK_SURFACE_RAISED),
          `${theme} accentText/raised`
        ).toBeGreaterThanOrEqual(4.5);
        expect(
          getContrastRatio(c.accentText, c.accentSoft),
          `${theme} accentText/soft`
        ).toBeGreaterThanOrEqual(4.5);
        expect(
          getContrastRatio(c.onAccent, c.accentFill),
          `${theme} onAccent/accentFill`
        ).toBeGreaterThanOrEqual(4.5);
        expect(
          getContrastRatio(c.chipText, c.chipBg),
          `${theme} chipText/chipBg`
        ).toBeGreaterThanOrEqual(4.5);
        for (const stop of c.heroStops) {
          expect(
            getContrastRatio(DARK_TEXT, stop),
            `${theme} hero text/${stop}`
          ).toBeGreaterThanOrEqual(4.5);
        }
      }
    });
  });
});
