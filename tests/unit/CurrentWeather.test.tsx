import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CurrentWeather from '../../src/components/CurrentWeather';
import type { City, CurrentWeather as CurrentWeatherData } from '../../src/types/weather';

const city: City = {
  id: 1,
  name: 'Rio de Janeiro',
  country: 'Brasil',
  latitude: -22.9,
  longitude: -43.2,
  timezone: 'America/Sao_Paulo',
};

const current: CurrentWeatherData = {
  time: '2026-09-30T14:00',
  temperatureCelsius: 20,
  weatherCode: 0,
  relativeHumidity: 68,
  windSpeedKmh: 11.5,
  precipitationMm: 0,
  pressureHpa: 1013.2,
};

describe('CurrentWeather', () => {
  it('renders a temperature hero, WMO condition and current metrics', () => {
    render(<CurrentWeather city={city} current={current} unit="celsius" />);

    expect(screen.getByRole('heading', { name: 'Rio de Janeiro' })).toBeInTheDocument();
    expect(screen.getByText('20°C')).toBeInTheDocument();
    expect(screen.getByText('Céu limpo')).toBeInTheDocument();
    expect(screen.getByText('68%')).toBeInTheDocument();
    expect(screen.getByText('11,5 km/h')).toBeInTheDocument();
    expect(screen.getByText('0 mm')).toBeInTheDocument();
    expect(screen.getByText('1.013,2 hPa')).toBeInTheDocument();
  });

  it('converts the hero temperature to the selected unit', () => {
    render(<CurrentWeather city={city} current={current} unit="fahrenheit" />);

    expect(screen.getByText('68°F')).toBeInTheDocument();
  });

  it('shows unavailable values when current observations are null', () => {
    render(
      <CurrentWeather
        city={city}
        current={{
          ...current,
          temperatureCelsius: null,
          weatherCode: null,
          relativeHumidity: null,
        }}
        unit="celsius"
      />,
    );

    expect(screen.getByText('Condição indisponível')).toBeInTheDocument();
    expect(screen.getAllByText('Indisponível')).toHaveLength(2);
  });

  it('does not render non-finite metrics or an invalid observation time', () => {
    render(
      <CurrentWeather
        city={city}
        current={{
          ...current,
          time: 'not-a-date',
          temperatureCelsius: Number.NaN,
          weatherCode: Number.NaN,
          relativeHumidity: Number.NaN,
          windSpeedKmh: undefined,
        }}
        unit="celsius"
      />,
    );

    expect(screen.getByText('Horário da observação indisponível')).toBeInTheDocument();
    expect(screen.getAllByText('Indisponível').length).toBeGreaterThan(1);
    expect(screen.getByText('Condição indisponível')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/NaN|undefined|Invalid Date/);
  });
});
