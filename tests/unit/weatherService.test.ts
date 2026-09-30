import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';
import type { City } from '../../src/types/weather';

const city: City = {
  id: 1,
  name: 'São Paulo',
  country: 'Brasil',
  admin1: 'São Paulo',
  latitude: -23.55,
  longitude: -46.63,
};
const forecast = {
  time: ['2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'],
  temperature_2m_min: [15, 16, 17, 18, 19],
  temperature_2m_max: [25, 26, 27, 28, 29],
  weather_code: [1, 2, 3, 61, 0],
  precipitation_probability_max: [10, 20, 30, 40, 0],
  precipitation_sum: [0, 1, 2, 3, 0],
};
const weatherPayload = {
  timezone: 'America/Sao_Paulo',
  current: { time: '2026-09-30T12:00', temperature_2m: 22, weather_code: 1 },
  daily: forecast,
};

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('weather service', () => {
  it('normalizes geocoding and forecast responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify({ results: [city] }), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify(weatherPayload), { status: 200 })),
    );
    await expect(searchCities(' São Paulo ')).resolves.toEqual([city]);
    expect(vi.mocked(fetch).mock.calls[0][0]).toContain('name=S%C3%A3o%20Paulo');
    const result = await getWeather(city);
    expect(result.forecast).toHaveLength(5);
    expect(result.forecast[0]).toMatchObject({
      date: '2026-09-30',
      minTemperatureCelsius: 15,
      maxTemperatureCelsius: 25,
      weatherCode: 1,
    });
    expect(result.current.temperatureCelsius).toBe(22);
    expect(result.timezone).toBe('America/Sao_Paulo');
    const forecastUrl = new URL(String(vi.mocked(fetch).mock.calls[1][0]));
    expect(forecastUrl.searchParams.get('current')).toContain('temperature_2m');
    expect(forecastUrl.searchParams.get('daily')).toContain('temperature_2m_min');
    expect(forecastUrl.searchParams.get('forecast_days')).toBe('5');
  });

  it('returns an empty collection for no search results', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ results: [] }), { status: 200 })),
    );
    await expect(searchCities('inexistente')).resolves.toEqual([]);
  });

  it('treats a geocoding response without results as an empty collection', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })));

    await expect(searchCities('cidade inexistente')).resolves.toEqual([]);
  });

  it('rejects a malformed results field', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ results: 'invalid' }), { status: 200 })),
    );

    await expect(searchCities('Lisboa')).rejects.toMatchObject({ kind: 'invalid' });
  });

  it.each(['', '   '])('returns no cities without fetching for blank names: %j', async (name) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchCities(name)).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps a city selectable when optional geocoding metadata is absent', async () => {
    const cityWithoutMetadata = { name: 'Singapore', latitude: 1.29, longitude: 103.85 };
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ results: [cityWithoutMetadata] }), { status: 200 }),
        ),
    );
    await expect(searchCities('Singapore')).resolves.toMatchObject([
      { name: 'Singapore', latitude: 1.29, longitude: 103.85 },
    ]);
  });

  it('treats null geocoding results as an empty collection', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{"results":null}', { status: 200 })),
    );

    await expect(searchCities('cidade inexistente')).resolves.toEqual([]);
  });

  it('discards geocoding items without valid coordinates', async () => {
    const invalidCity = { id: 3, name: 'Cidade sem coordenadas', country: 'Brasil' };
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ results: [invalidCity, city] }), { status: 200 }),
        ),
    );

    await expect(searchCities('São Paulo')).resolves.toEqual([city]);
  });

  it.each([
    "D'Arcy-sur-Mer",
    'São Tomé & Príncipe',
    'Rio/Mar #2',
  ])('preserves special characters in geocoding name %j', async (name) => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ results: [city] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await searchCities(name);

    const requestUrl = new URL(String(fetchMock.mock.calls[0][0]));
    expect(requestUrl.searchParams.get('name')).toBe(name);
  });

  it('preserves valid forecast days when individual daily values are missing', async () => {
    const partialWeather = {
      timezone: 'America/Sao_Paulo',
      current: weatherPayload.current,
      daily: {
        ...forecast,
        temperature_2m_min: [15, null, 17, 18, 19],
        weather_code: [1, 2, null, 61, 0],
      },
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify(partialWeather), { status: 200 })),
    );
    const result = await getWeather(city);
    expect(result.forecast).toHaveLength(5);
    expect(result.forecast[1].minTemperatureCelsius).toBeNull();
    expect(result.forecast[2].weatherCode).toBeNull();
    expect(result.forecast[3].maxTemperatureCelsius).toBe(28);
  });

  it('preserves explicit null precipitation as unavailable for current and daily data', async () => {
    const payloadWithNullPrecipitation = {
      ...weatherPayload,
      current: { ...weatherPayload.current, precipitation: null },
      daily: { ...forecast, precipitation_sum: [0, 1, null, 3, 0] },
    };
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify(payloadWithNullPrecipitation), { status: 200 }),
        ),
    );

    const result = await getWeather(city);

    expect(result.current.precipitationMm).toBeNull();
    expect(result.forecast[2].precipitationMm).toBeNull();
  });

  it('maps absent current and daily scalar fields to null and falls back to UTC timezone', async () => {
    const partialPayload = { daily: { time: forecast.time } };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify(partialPayload), { status: 200 })),
    );

    const result = await getWeather(city);

    expect(result.timezone).toBe('UTC');
    expect(result.current).toEqual({
      time: null,
      temperatureCelsius: null,
      weatherCode: null,
      isDay: null,
      relativeHumidity: null,
      windSpeedKmh: null,
      precipitationMm: null,
      pressureHpa: null,
    });
    expect(result.forecast[0]).toMatchObject({
      minTemperatureCelsius: null,
      maxTemperatureCelsius: null,
      weatherCode: null,
      precipitationProbability: null,
      precipitationMm: null,
    });
  });

  it('rejects a response without the required daily dates', async () => {
    const payload = { timezone: 'America/Sao_Paulo', current: weatherPayload.current };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify(payload), { status: 200 })),
    );

    await expect(getWeather(city)).rejects.toMatchObject({ kind: 'invalid' });
  });

  it('rejects invalid daily dates instead of exposing invalid date text', async () => {
    const payload = {
      ...weatherPayload,
      daily: { ...forecast, time: ['2026-02-30', ...forecast.time.slice(1)] },
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify(payload), { status: 200 })),
    );

    await expect(getWeather(city)).rejects.toMatchObject({ kind: 'invalid' });
  });

  it('classifies HTTP, invalid and partial responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response('{}', { status: 500 })));
    await expect(searchCities('erro')).rejects.toMatchObject({ kind: 'http' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response('{}', { status: 200 })));
    await expect(getWeather(city)).rejects.toBeInstanceOf(WeatherServiceError);
  });

  it('classifies a forecast HTTP failure as an HTTP service error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 503 })));

    await expect(getWeather(city)).rejects.toMatchObject({ kind: 'http', statusCode: 503 });
  });

  it('classifies a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(searchCities('offline')).rejects.toMatchObject({
      kind: 'network',
      message:
        'Não foi possível conectar ao serviço meteorológico. Verifique sua conexão e tente novamente.',
    });
  });

  it('maps AbortError to timeout after 10 seconds and clears its timer', async () => {
    vi.useFakeTimers();
    const requestSignals: AbortSignal[] = [];
    const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
      const requestSignal = init?.signal;
      if (requestSignal) requestSignals.push(requestSignal);
      return new Promise<Response>((_resolve, reject) => {
        requestSignal?.addEventListener(
          'abort',
          () => reject(new DOMException('Aborted', 'AbortError')),
          { once: true },
        );
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    const rejection = expect(searchCities('Lisboa')).rejects.toMatchObject({
      kind: 'timeout',
      message: 'A conexão demorou demais. Tente novamente.',
    });

    await vi.advanceTimersByTimeAsync(9_999);
    expect(requestSignals[0]?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await rejection;

    expect(requestSignals[0]?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('clears the timeout when fetch fails with a network error', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    await expect(searchCities('Lisboa')).rejects.toMatchObject({
      kind: 'network',
      message:
        'Não foi possível conectar ao serviço meteorológico. Verifique sua conexão e tente novamente.',
    });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('keeps the timeout active while reading the JSON response body', async () => {
    vi.useFakeTimers();
    let requestSignal: AbortSignal | undefined;
    const response = new Response();
    vi.spyOn(response, 'json').mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          requestSignal?.addEventListener(
            'abort',
            () => reject(new DOMException('Aborted', 'AbortError')),
            { once: true },
          );
        }),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        requestSignal = init?.signal ?? undefined;
        return Promise.resolve(response);
      }),
    );
    const rejection = expect(searchCities('Lisboa')).rejects.toMatchObject({
      kind: 'timeout',
      message: 'A conexão demorou demais. Tente novamente.',
    });

    await vi.advanceTimersByTimeAsync(10_000);
    await rejection;

    expect(requestSignal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});
