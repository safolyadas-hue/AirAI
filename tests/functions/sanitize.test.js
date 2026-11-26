import { describe, it, expect } from 'vitest';
import { cleanModelText, sanitizeModelPayload } from '../../netlify/functions/lib/sanitize.js';

describe('AI Text Sanitization Utilities', () => {
  describe('cleanModelText', () => {
    it('converts exact string "$\\text{PM}_{2.5}$" to plain text PM2.5', () => {
      const input = '$\\text{PM}_{2.5}$';
      const output = cleanModelText(input);
      expect(output).toBe('PM2.5');
    });

    it('converts common pollutant LaTeX variants to plain text', () => {
      expect(cleanModelText('$\\text{PM}_{10}$')).toBe('PM10');
      expect(cleanModelText('$\\text{NO}_2$')).toBe('NO2');
      expect(cleanModelText('$\\text{O}_3$')).toBe('O3');
      expect(cleanModelText('$\\text{SO}_2$')).toBe('SO2');
      expect(cleanModelText('$\\mathrm{PM}_{2.5}$')).toBe('PM2.5');
      expect(cleanModelText('$\\mathbf{PM}_{2.5}$')).toBe('PM2.5');
    });

    it('converts LaTeX units to standard unicode symbols', () => {
      expect(cleanModelText('\\mu g/m^3')).toBe('µg/m³');
      expect(cleanModelText('$\\mu g/m^3$')).toBe('µg/m³');
      expect(cleanModelText('120 \\mu g/m^{3}')).toBe('120 µg/m³');
      expect(cleanModelText('50 \\mu g')).toBe('50 µg');
    });

    it('removes math delimiters and converts comparison symbols', () => {
      expect(cleanModelText('$AQI > 150$')).toBe('AQI > 150');
      expect(cleanModelText('$$x = y$$')).toBe('x = y');
      expect(cleanModelText('\\(AQI \\le 50\\)')).toBe('AQI ≤ 50');
      expect(cleanModelText('\\[PM \\ge 100\\]')).toBe('PM ≥ 100');
    });

    it('strips HTML tags and preserves readable text', () => {
      expect(cleanModelText('<p>High smog <b>warning</b></p>')).toBe('High smog warning');
      expect(cleanModelText('<span class="alert">Alert</span>')).toBe('Alert');
    });

    it('strips control characters while preserving valid newlines', () => {
      const input = 'Clean\x00 air\x08 guidelines:\n- Ventilate\x1F';
      const output = cleanModelText(input);
      expect(output).toBe('Clean air guidelines:\n- Ventilate');
    });

    it('handles non-string inputs safely without throwing', () => {
      expect(cleanModelText(null)).toBe('');
      expect(cleanModelText(undefined)).toBe('');
      expect(cleanModelText(150)).toBe('150');
      expect(cleanModelText(true)).toBe('true');
    });
  });

  describe('sanitizeModelPayload', () => {
    it('recursively cleans nested objects and arrays containing LaTeX', () => {
      const rawAdvice = {
        summary: 'Exposure to $\\text{PM}_{2.5}$ exceeds safe thresholds at 180 $\\mu g/m^3$.',
        dailyPlan: {
          morning: 'Check $\\text{PM}_{2.5}$ levels before jogging.',
          evening: 'Seal windows against $\\text{PM}_{10}$.'
        },
        indoorTips: [
          'Run True HEPA filter to capture fine $\\text{PM}_{2.5}$ particles.',
          '<p>Wet mop hard surfaces daily.</p>'
        ],
        impactExplanations: [
          {
            actionId: 'n95-mask',
            explanation: 'N95 filters reduce $\\text{PM}_{2.5}$ by up to 85%.'
          }
        ]
      };

      const cleaned = sanitizeModelPayload(rawAdvice);

      expect(cleaned.summary).toBe('Exposure to PM2.5 exceeds safe thresholds at 180 µg/m³.');
      expect(cleaned.dailyPlan.morning).toBe('Check PM2.5 levels before jogging.');
      expect(cleaned.dailyPlan.evening).toBe('Seal windows against PM10.');
      expect(cleaned.indoorTips[0]).toBe('Run True HEPA filter to capture fine PM2.5 particles.');
      expect(cleaned.indoorTips[1]).toBe('Wet mop hard surfaces daily.');
      expect(cleaned.impactExplanations[0].explanation).toBe(
        'N95 filters reduce PM2.5 by up to 85%.'
      );
    });
  });
});
