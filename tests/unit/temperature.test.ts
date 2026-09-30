import { describe, expect, it } from 'vitest';
import { formatTemperature } from '../../src/lib/format';
import {
  celsiusToFahrenheit,
  convertTemperature,
  fahrenheitToCelsius,
  roundTemperature,
  unitLabel,
} from '../../src/lib/temperature';

describe('temperature', () => {
  it.each([
    [0, 32],
    [100, 212],
    [-40, -40],
  ])('converts %i °C to %i °F', (celsius, fahrenheit) => {
    expect(celsiusToFahrenheit(celsius)).toBe(fahrenheit);
  });

  it('converts Celsius and Fahrenheit in both directions', () => {
    expect(celsiusToFahrenheit(0)).toBe(32);
    expect(celsiusToFahrenheit(-10)).toBe(14);
    expect(fahrenheitToCelsius(32)).toBe(0);
    expect(fahrenheitToCelsius(14)).toBe(-10);
  });

  it('converts presentation values according to the selected unit', () => {
    expect(convertTemperature(21, 'celsius')).toBe(21);
    expect(convertTemperature(0, 'fahrenheit')).toBe(32);
    expect(convertTemperature(100, 'fahrenheit')).toBe(212);
  });

  it('rounds consistently for presentation', () => {
    expect(roundTemperature(20.4)).toBe(20);
    expect(roundTemperature(20.5)).toBe(21);
    expect(roundTemperature(-20.4)).toBe(-20);
    expect(roundTemperature(-20.5)).toBe(-21);
    expect(convertTemperature(20, 'fahrenheit')).toBe(68);
  });

  it('formats rounded temperatures with the supplied unit symbol', () => {
    expect(formatTemperature(21.6, unitLabel('celsius'))).toBe('22°C');
    expect(formatTemperature(-21.6, unitLabel('fahrenheit'))).toBe('-22°F');
  });

  it('returns the display label for each unit', () => {
    expect(unitLabel('celsius')).toBe('°C');
    expect(unitLabel('fahrenheit')).toBe('°F');
  });
});