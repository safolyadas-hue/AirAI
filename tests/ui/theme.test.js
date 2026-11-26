/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  cycleTheme,
  cycleFontSize,
  getSavedTheme,
  getSavedFontSize,
  applyTheme,
  applyFontSize
} from '../../public/js/ui/a11y.js';
import { AQI_THEME_MAP, STORAGE_KEYS } from '../../public/js/config.js';
import { getCategory, AQI_CATEGORIES } from '../../public/js/domain/aqi.js';

describe('Theme & Font Preference Persistence & AQI Mapping', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('font-large', 'font-larger');
  });

  describe('Theme toggle persistence', () => {
    it('defaults to system when no preference stored', () => {
      expect(getSavedTheme()).toBe('system');
    });

    it('persists and applies light theme', () => {
      applyTheme('light');
      expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(getSavedTheme()).toBe('light');
    });

    it('persists and applies dark theme', () => {
      applyTheme('dark');
      expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(getSavedTheme()).toBe('dark');
    });

    it('cycles sequentially through themes', () => {
      applyTheme('system');
      const t1 = cycleTheme();
      expect(t1).toBe('light');

      const t2 = cycleTheme();
      expect(t2).toBe('dark');

      const t3 = cycleTheme();
      expect(t3).toBe('system');
    });
  });

  describe('Font size scale persistence', () => {
    it('defaults to normal size', () => {
      expect(getSavedFontSize()).toBe('normal');
    });

    it('persists large and larger classes on document root', () => {
      applyFontSize('large');
      expect(document.documentElement.classList.contains('font-large')).toBe(true);
      expect(localStorage.getItem(STORAGE_KEYS.FONT_SIZE)).toBe('large');

      applyFontSize('larger');
      expect(document.documentElement.classList.contains('font-larger')).toBe(true);
      expect(document.documentElement.classList.contains('font-large')).toBe(false);
      expect(localStorage.getItem(STORAGE_KEYS.FONT_SIZE)).toBe('larger');
    });

    it('cycles font scale through normal, large, larger', () => {
      applyFontSize('normal');
      expect(cycleFontSize()).toBe('large');
      expect(cycleFontSize()).toBe('larger');
      expect(cycleFontSize()).toBe('normal');
    });
  });

  describe('AQI Category ID to data-aqi Mapping', () => {
    it('maps all 6 domain categories to valid data-aqi values', () => {
      expect(AQI_THEME_MAP.good).toBe('good');
      expect(AQI_THEME_MAP.moderate).toBe('moderate');
      expect(AQI_THEME_MAP.unhealthy_sensitive).toBe('usg');
      expect(AQI_THEME_MAP.unhealthy).toBe('unhealthy');
      expect(AQI_THEME_MAP.very_unhealthy).toBe('very-unhealthy');
      expect(AQI_THEME_MAP.hazardous).toBe('hazardous');
    });

    it('maps getCategory outputs directly to data-aqi tokens', () => {
      const sampleAqiValues = [25, 75, 125, 175, 250, 450];
      const expectedTokens = [
        'good',
        'moderate',
        'usg',
        'unhealthy',
        'very-unhealthy',
        'hazardous'
      ];

      sampleAqiValues.forEach((val, idx) => {
        const cat = getCategory(val);
        const mappedToken = AQI_THEME_MAP[cat.id];
        expect(mappedToken).toBe(expectedTokens[idx]);
      });
    });

    it('covers every category in AQI_CATEGORIES configuration', () => {
      AQI_CATEGORIES.forEach((cat) => {
        expect(AQI_THEME_MAP[cat.id]).toBeDefined();
        expect(typeof AQI_THEME_MAP[cat.id]).toBe('string');
      });
    });
  });
});
