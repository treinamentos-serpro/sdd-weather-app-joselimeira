import { describe, expect, it } from 'vitest';
import { getWeatherCondition } from '../../src/lib/weatherCodes';

describe('weather codes', () => {
  it('maps known and unknown WMO codes to accessible text', () => {
    expect(getWeatherCondition(0).label).toBe('Céu limpo');
    expect(getWeatherCondition(999).label).toBe('Condição indisponível');
  });
});