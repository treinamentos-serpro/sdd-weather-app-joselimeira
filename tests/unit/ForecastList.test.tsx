import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ForecastList from '../../src/components/ForecastList';
import type { ForecastDay } from '../../src/types/weather';

const forecast: ForecastDay[] = [
  {
    date: '2026-09-30',
    minTemperatureCelsius: 10,
    maxTemperatureCelsius: 20,
    weatherCode: 0,
    precipitationProbability: 0,
  },
  {
    date: '2026-10-01',
    minTemperatureCelsius: 11,
    maxTemperatureCelsius: 21,
    weatherCode: 1,
    precipitationProbability: 10,
  },
  {
    date: '2026-10-02',
    minTemperatureCelsius: 12,
    maxTemperatureCelsius: 22,
    weatherCode: 2,
    precipitationProbability: 20,
  },
  {
    date: '2026-10-03',
    minTemperatureCelsius: 13,
    maxTemperatureCelsius: 23,
    weatherCode: 3,
    precipitationProbability: 30,
  },
  {
    date: '2026-10-04',
    minTemperatureCelsius: 14,
    maxTemperatureCelsius: 24,
    weatherCode: 61,
    precipitationProbability: null,
  },
];

describe('ForecastList', () => {
  it('renders five dated cards with weather condition and rain probability', () => {
    render(<ForecastList forecast={forecast} unit="celsius" />);

    expect(screen.getByRole('heading', { name: 'Previsão de 5 dias' })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(screen.getByRole('article', { name: /30/ })).toHaveTextContent('Céu limpo');
    expect(screen.getAllByText('Máx')).toHaveLength(5);
    expect(screen.getAllByText('Mín')).toHaveLength(5);
    expect(screen.getByText('Chuva 0%')).toBeInTheDocument();
    expect(screen.getByText('Chuva indisponível')).toBeInTheDocument();
  });

  it('converts maximum and minimum temperatures to the active unit', () => {
    render(<ForecastList forecast={forecast} unit="fahrenheit" />);

    expect(screen.getByRole('article', { name: /30/ })).toHaveTextContent('68°F');
    expect(screen.getByRole('article', { name: /30/ })).toHaveTextContent('50°F');
  });

  it('renders unavailable labels for non-finite values and invalid dates', () => {
    const malformedForecast = [
      {
        ...forecast[0],
        date: '2026-02-30',
        minTemperatureCelsius: Number.NaN,
        maxTemperatureCelsius: Number.NaN,
        weatherCode: Number.NaN,
        precipitationProbability: Number.NaN,
      },
      ...forecast.slice(1),
    ];
    render(<ForecastList forecast={malformedForecast} unit="celsius" />);

    const firstDay = screen.getByRole('article', { name: /Dia indisponível/ });
    expect(firstDay).toHaveTextContent('Data indisponível');
    expect(firstDay).toHaveTextContent('Condição indisponível');
    expect(firstDay).toHaveTextContent('Chuva indisponível');
    expect(document.body.textContent).not.toMatch(/NaN|undefined|Invalid Date/);
  });
});
