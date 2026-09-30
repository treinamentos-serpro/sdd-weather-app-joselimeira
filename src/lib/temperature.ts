import type { Unit } from '../types/weather';

export function celsiusToFahrenheit(value: number): number { return (value * 9) / 5 + 32; }
export function fahrenheitToCelsius(value: number): number { return ((value - 32) * 5) / 9; }
export function roundTemperature(value: number): number {
  const rounded = value < 0 ? -Math.round(Math.abs(value)) : Math.round(value);
  return rounded === 0 ? 0 : rounded;
}

export function unitLabel(unit: Unit): string {
  return unit === 'celsius' ? '°C' : '°F';
}

export function convertTemperature(valueCelsius: number, unit: Unit): number {
  return roundTemperature(unit === 'fahrenheit' ? celsiusToFahrenheit(valueCelsius) : valueCelsius);
}