import { describe, it, expect } from 'vitest';
import {
  getAqiCategory,
  getAqiColor,
  shouldLimitOutdoorActivity
} from '../../public/js/domain/aqi.js';

describe('AQI Domain Logic', () => {
  it('correctly maps AQI values to categories', () => {
    expect(getAqiCategory(25)).toBe('good');
    expect(getAqiCategory(75)).toBe('moderate');
    expect(getAqiCategory(120)).toBe('unhealthySensitive');
    expect(getAqiCategory(180)).toBe('unhealthy');
    expect(getAqiCategory(250)).toBe('veryUnhealthy');
    expect(getAqiCategory(400)).toBe('hazardous');
  });

  it('handles edge cases gracefully', () => {
    expect(getAqiCategory(-10)).toBe('good');
    expect(getAqiCategory(NaN)).toBe('good');
  });

  it('determines when outdoor activity should be restricted', () => {
    expect(shouldLimitOutdoorActivity(40)).toBe(false);
    expect(shouldLimitOutdoorActivity(55)).toBe(true);
    expect(shouldLimitOutdoorActivity(210)).toBe(true);
  });

  it('returns valid color codes for categories', () => {
    expect(getAqiColor(30)).toBe('#007a3d');
    expect(getAqiColor(350)).toBe('#590024');
  });
});
