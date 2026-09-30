import { describe, expect, it } from 'vitest';
import { formatDate, formatTemperature, formatTime, getDayLabel, getShortDate } from '../../src/lib/format';

describe('format', () => {
  it('formats numbers and dates in Portuguese', () => {
    expect(formatTemperature(21, '°C')).toBe('21°C');
    expect(formatDate('2026-09-30')).toMatch(/30/);
    expect(formatTime('2026-09-30T14:05:00')).toMatch(/14:05/);
  });

  it('labels forecast indices as today, tomorrow, then weekday', () => {
    expect(getDayLabel(0, '2026-09-30')).toBe('Hoje');
    expect(getDayLabel(1, '2026-10-01')).toBe('Amanhã');
    expect(getDayLabel(2, '2026-10-02')).toBe('sexta-feira');
  });

  it('formats a short local date in Portuguese', () => {
    expect(getShortDate('2026-10-02')).toMatch(/2.*out/i);
  });
});