import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from '../../src/App';

const city = { id: 1, name: 'São Paulo', country: 'Brasil', latitude: -23.5, longitude: -46.6 };
const weather = {
  timezone: 'America/Sao_Paulo',
  current: {
    time: '2026-09-30T12:00',
    temperature_2m: 20,
    weather_code: 0,
    relative_humidity_2m: 65,
    wind_speed_10m: 8.5,
    precipitation: 0,
    surface_pressure: 1013.2,
  },
  daily: {
    time: ['2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'],
    temperature_2m_min: [10, 11, 12, 13, 14],
    temperature_2m_max: [20, 21, 22, 23, 24],
    weather_code: [0, 1, 2, 3, 61],
  },
};

function mockWeather() {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ results: [city] })))
      .mockResolvedValueOnce(new Response(JSON.stringify(weather))),
  );
}

describe('App', () => {
  it('renders idle without weather data or an API request', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);

    expect(screen.getByRole('status')).toHaveTextContent('Digite uma cidade para consultar');
    expect(screen.queryByRole('heading', { name: 'Previsão de 5 dias' })).not.toBeInTheDocument();
    expect(screen.queryAllByRole('article')).toHaveLength(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('applies Fahrenheit selected while forecast is loading', async () => {
    let resolveForecast!: (response: Response) => void;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ results: [city] })))
      .mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            resolveForecast = resolve;
          }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('Nome da cidade'), 'São Paulo');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(screen.getByRole('group', { name: 'Unidade de temperatura' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Encontre uma cidade' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await user.click(screen.getByRole('button', { name: '°F' }));

    await act(async () => {
      resolveForecast(new Response(JSON.stringify(weather)));
    });

    expect(await screen.findAllByText('68°F')).not.toHaveLength(0);
  });

  it('searches, selects, displays five days and changes unit without another request', async () => {
    mockWeather();
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText('Nome da cidade'), 'São Paulo');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    await user.click(await screen.findByRole('button', { name: /São Paulo/ }));
    expect(await screen.findByRole('heading', { name: 'Previsão de 5 dias' })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(5);
    const calls = vi.mocked(fetch).mock.calls.length;
    await user.click(screen.getByRole('button', { name: '°F' }));
    expect(screen.getAllByText('68°F')).toHaveLength(2);
    expect(vi.mocked(fetch).mock.calls.length).toBe(calls);
  });

  it('moves focus to the weather results after a successful search', async () => {
    mockWeather();
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText('Nome da cidade'), 'São Paulo');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    const weatherResults = await screen.findByRole('region', {
      name: 'Condições meteorológicas',
    });
    await waitFor(() => expect(weatherResults).toHaveFocus());
    expect(screen.getByRole('region', { name: 'Encontre uma cidade' })).toHaveAttribute(
      'aria-busy',
      'false',
    );
  });

  it('shows validation and empty states', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Informe o nome de uma cidade.');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ results: [] }))),
    );
    await user.type(screen.getByLabelText('Nome da cidade'), 'Atlantis');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Nenhuma cidade encontrada'),
    );
  });

  it('does not start geocoding when the query contains only spaces', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText('Nome da cidade'), '   ');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Informe o nome de uma cidade.');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps valid forecast days visible when a daily value is missing', async () => {
    const partialWeather = {
      ...weather,
      daily: { ...weather.daily, temperature_2m_min: [10, null, 12, 13, 14] },
    };
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify({ results: [city] })))
        .mockResolvedValueOnce(new Response(JSON.stringify(partialWeather))),
    );
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText('Nome da cidade'), 'São Paulo');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    await user.click(await screen.findByRole('button', { name: /São Paulo/ }));

    expect(await screen.findByText('Indisponível')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(5);
  });

  it('renders safe fallbacks when optional API weather fields are absent', async () => {
    const partialWeather = { current: {}, daily: { time: weather.daily.time } };
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify({ results: [city] })))
        .mockResolvedValueOnce(new Response(JSON.stringify(partialWeather))),
    );
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText('Nome da cidade'), 'São Paulo');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(await screen.findByRole('heading', { name: 'São Paulo' })).toBeInTheDocument();
    expect(screen.getByText('Horário da observação indisponível')).toBeInTheDocument();
    expect(screen.getAllByText('Indisponível').length).toBeGreaterThan(5);
    expect(screen.getAllByText('Condição indisponível')).toHaveLength(6);
    expect(screen.getAllByText('Chuva indisponível')).toHaveLength(5);
    expect(document.body.textContent).not.toMatch(/NaN|undefined|null|Invalid Date/);
  });

  it('shows forecast failure and retries the last operation', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify({ results: [city] })))
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce(new Response(JSON.stringify(weather))),
    );
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText('Nome da cidade'), 'São Paulo');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível conectar ao serviço meteorológico. Verifique sua conexão e tente novamente.',
    );
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByRole('heading', { name: 'São Paulo' })).toBeInTheDocument();
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(3);
  });
});
