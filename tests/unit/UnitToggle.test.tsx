import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import CurrentWeather from '../../src/components/CurrentWeather';
import UnitToggle from '../../src/components/UnitToggle';
import type { City, CurrentWeather as CurrentWeatherData, Unit } from '../../src/types/weather';

const testCity: City = {
  id: 1,
  name: 'Recife',
  country: 'Brasil',
  latitude: -8.05,
  longitude: -34.9,
};

const zeroCelsiusWeather: CurrentWeatherData = {
  time: '2026-09-30T12:00',
  temperatureCelsius: 0,
  weatherCode: 0,
};

function UnitAndCurrentWeather() {
  const [unit, setUnit] = useState<Unit>('celsius');

  return (
    <>
      <UnitToggle unit={unit} onChange={setUnit} />
      <CurrentWeather city={testCity} current={zeroCelsiusWeather} unit={unit} />
    </>
  );
}

describe('UnitToggle', () => {
  it('exposes a named group and the active unit with aria-pressed', () => {
    const onChange = vi.fn();
    render(<UnitToggle unit="celsius" onChange={onChange} />);

    expect(screen.getByRole('group', { name: 'Unidade de temperatura' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '°C' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '°F' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('changes unit and moves focus with arrow keys', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<UnitToggle unit="celsius" onChange={onChange} />);

    await user.tab();
    expect(screen.getByRole('button', { name: '°C' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');

    expect(onChange).toHaveBeenCalledWith('fahrenheit');
    expect(screen.getByRole('button', { name: '°F' })).toHaveFocus();
  });

  it('converts a 0°C current reading to 32°F when Fahrenheit is selected', async () => {
    const user = userEvent.setup();
    render(<UnitAndCurrentWeather />);

    await user.click(screen.getByRole('button', { name: '°F' }));

    expect(screen.getByText('32°F')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '°F' })).toHaveAttribute('aria-pressed', 'true');
  });
});
