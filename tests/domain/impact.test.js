import { describe, it, expect } from 'vitest';
import { calculateEmissionsSaved, estimateIndoorPm25 } from '../../public/js/domain/impact.js';

describe('Impact Engine Domain Logic', () => {
  it('calculates avoided CO2 emissions for zero-emission commute', () => {
    const saved = calculateEmissionsSaved(10, 'bike');
    expect(saved).toBe(1.71);
  });

  it('calculates transit emission savings', () => {
    const saved = calculateEmissionsSaved(10, 'transit');
    expect(saved).toBe(1.03);
  });

  it('returns 0 for negative or invalid distances', () => {
    expect(calculateEmissionsSaved(0, 'bike')).toBe(0);
    expect(calculateEmissionsSaved(-5, 'bike')).toBe(0);
  });

  it('estimates indoor PM2.5 levels with and without filtration', () => {
    const outdoorPm25 = 100;
    const indoorWithFilter = estimateIndoorPm25(outdoorPm25, true);
    const indoorWithoutFilter = estimateIndoorPm25(outdoorPm25, false);

    expect(indoorWithFilter).toBe(15);
    expect(indoorWithoutFilter).toBe(70);
  });
});
