import { describe, it, expect } from 'vitest';
import {
  METEOROLOGICAL_THRESHOLDS,
  computeStagnationRisk,
  analyzeHourlyForecast,
  findBestAirWindow,
  getSafeExerciseWindows
} from '../../public/js/domain/hourly.js';

describe('Hourly Forecast & Stagnation Domain Logic', () => {
  it('exports frozen meteorological thresholds', () => {
    expect(Object.isFrozen(METEOROLOGICAL_THRESHOLDS)).toBe(true);
    expect(METEOROLOGICAL_THRESHOLDS.STAGNATION_WIND_SPEED_MAX_KMH).toBe(5.0);
    expect(METEOROLOGICAL_THRESHOLDS.STAGNATION_TEMP_MAX_CELSIUS).toBe(10.0);
    expect(METEOROLOGICAL_THRESHOLDS.STAGNATION_HUMIDITY_MIN_PERCENT).toBe(70.0);
  });

  describe('computeStagnationRisk', () => {
    it('returns high when all 3 inversion conditions are satisfied (calm, cold, humid)', () => {
      // wind <= 5, temp <= 10, humidity >= 70
      const risk = computeStagnationRisk(3.0, 7.0, 85);
      expect(risk).toBe('high');
    });

    it('returns moderate when 2 inversion conditions are satisfied', () => {
      // calm wind + high humidity, but warmer temp
      const risk1 = computeStagnationRisk(4.0, 18.0, 80);
      expect(risk1).toBe('moderate');

      // calm wind + cold temp, but dry humidity
      const risk2 = computeStagnationRisk(2.5, 6.0, 45);
      expect(risk2).toBe('moderate');
    });

    it('returns low when 0 or 1 condition is satisfied', () => {
      // brisk wind, mild temp, normal humidity
      const risk = computeStagnationRisk(15.0, 22.0, 50);
      expect(risk).toBe('low');
    });

    it('handles missing or NaN parameters gracefully', () => {
      expect(computeStagnationRisk()).toBe('low');
      expect(computeStagnationRisk(NaN, NaN, NaN)).toBe('low');
      expect(computeStagnationRisk(3.0)).toBe('low');
    });
  });

  describe('analyzeHourlyForecast', () => {
    const sampleForecast = [
      { time: '06:00', aqi: 240, windSpeed: 2.0, temperature: 6.0, humidity: 85 },
      { time: '09:00', aqi: 210, windSpeed: 3.5, temperature: 9.0, humidity: 75 },
      { time: '12:00', aqi: 130, windSpeed: 8.0, temperature: 18.0, humidity: 50 },
      { time: '15:00', aqi: 95, windSpeed: 10.0, temperature: 20.0, humidity: 45 },
      { time: '18:00', aqi: 180, windSpeed: 5.0, temperature: 14.0, humidity: 65 },
      { time: '21:00', aqi: 220, windSpeed: 3.0, temperature: 8.0, humidity: 80 }
    ];

    it('correctly identifies best and worst outdoor windows', () => {
      const result = analyzeHourlyForecast(sampleForecast);
      expect(result.bestWindow).not.toBeNull();
      expect(result.bestWindow?.time).toBe('15:00');
      expect(result.bestWindow?.aqi).toBe(95);

      expect(result.worstWindow).not.toBeNull();
      expect(result.worstWindow?.time).toBe('06:00');
      expect(result.worstWindow?.aqi).toBe(240);
    });

    it('detects moderate to high stagnation risk across multiple cold hours', () => {
      const result = analyzeHourlyForecast(sampleForecast);
      expect(['moderate', 'high']).toContain(result.stagnationRisk);
      expect(result.dataPointsCount).toBe(6);
    });

    it('supports parallel array format', () => {
      const aqiArray = [120, 80, 190];
      const winds = [2, 10, 3];
      const temps = [5, 18, 7];
      const humidities = [85, 40, 80];

      const result = analyzeHourlyForecast(aqiArray, winds, temps, humidities);
      expect(result.bestWindow?.aqi).toBe(80);
      expect(result.worstWindow?.aqi).toBe(190);
      expect(result.dataPointsCount).toBe(3);
    });

    it('handles empty or missing forecast data gracefully', () => {
      const emptyResult = analyzeHourlyForecast([]);
      expect(emptyResult.bestWindow).toBeNull();
      expect(emptyResult.worstWindow).toBeNull();
      expect(emptyResult.stagnationRisk).toBe('low');
      expect(emptyResult.dataPointsCount).toBe(0);

      // @ts-expect-error test null input
      const nullResult = analyzeHourlyForecast(null);
      expect(nullResult.bestWindow).toBeNull();
    });
  });

  describe('Legacy compatibility helpers', () => {
    const list = [
      { time: '08:00', aqi: 150, pm25: 60 },
      { time: '12:00', aqi: 80, pm25: 25 },
      { time: '16:00', aqi: 95, pm25: 32 }
    ];

    it('findBestAirWindow returns point with minimum AQI', () => {
      const best = findBestAirWindow(list);
      expect(best?.time).toBe('12:00');
      expect(best?.aqi).toBe(80);
    });

    it('getSafeExerciseWindows filters points by threshold', () => {
      const safe = getSafeExerciseWindows(list, 100);
      expect(safe).toHaveLength(2);
      expect(safe.map((s) => s.time)).toEqual(['12:00', '16:00']);
    });
  });
});
