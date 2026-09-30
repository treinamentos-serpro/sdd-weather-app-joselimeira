import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useWeather from '../../src/hooks/useWeather';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';
import type { City, WeatherData } from '../../src/types/weather';

vi.mock('../../src/services/weatherService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/weatherService')>();
  return { ...actual, getWeather: vi.fn(), searchCities: vi.fn() };
});

const lisbon: City = {
  id: 1,
  name: 'Lisboa',
  country: 'Portugal',
  latitude: 38.72,
  longitude: -9.14,
};

const porto: City = {
  id: 2,
  name: 'Porto',
  country: 'Portugal',
  latitude: 41.15,
  longitude: -8.61,
};

function weatherFor(city: City): WeatherData {
  return {
    city,
    current: { time: '2026-09-30T12:00', temperatureCelsius: 20, weatherCode: 0 },
    forecast: [
      { date: '2026-09-30', minTemperatureCelsius: 10, maxTemperatureCelsius: 20, weatherCode: 0 },
      { date: '2026-10-01', minTemperatureCelsius: 11, maxTemperatureCelsius: 21, weatherCode: 1 },
      { date: '2026-10-02', minTemperatureCelsius: 12, maxTemperatureCelsius: 22, weatherCode: 2 },
      { date: '2026-10-03', minTemperatureCelsius: 13, maxTemperatureCelsius: 23, weatherCode: 3 },
      { date: '2026-10-04', minTemperatureCelsius: 14, maxTemperatureCelsius: 24, weatherCode: 61 },
    ],
    timezone: 'Europe/Lisbon',
    fetchedAt: '2026-09-30T12:05:00.000Z',
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useWeather', () => {
  it('does not start a duplicate search while the same term is pending', async () => {
    let resolveSearch!: (cities: City[]) => void;
    vi.mocked(searchCities).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSearch = resolve;
        }),
    );
    vi.mocked(getWeather).mockImplementation(async (city) => weatherFor(city));
    const { result } = renderHook(() => useWeather());
    let firstSearch!: Promise<void>;
    let duplicateSearch!: Promise<void>;

    act(() => {
      firstSearch = result.current.search('Lisboa');
      duplicateSearch = result.current.search(' Lisboa ');
    });

    expect(searchCities).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolveSearch([lisbon]);
      await Promise.all([firstSearch, duplicateSearch]);
    });
    expect(result.current.cities).toEqual([lisbon]);
    expect(result.current.data?.city).toEqual(lisbon);
    expect(getWeather).toHaveBeenCalledOnce();
  });

  it('keeps only results from the most recent search when responses arrive out of order', async () => {
    const resolvers: Array<(cities: City[]) => void> = [];
    vi.mocked(searchCities).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvers.push(resolve);
        }),
    );
    vi.mocked(getWeather).mockImplementation(async (city) => weatherFor(city));
    const { result } = renderHook(() => useWeather());
    let olderSearch!: Promise<void>;
    let newerSearch!: Promise<void>;

    act(() => {
      olderSearch = result.current.search('Lisboa');
      newerSearch = result.current.search('Porto');
    });

    await act(async () => {
      resolvers[1]([porto]);
      await newerSearch;
    });
    await act(async () => {
      resolvers[0]([lisbon]);
      await olderSearch;
    });

    expect(result.current.cities).toEqual([porto]);
    expect(result.current.data?.city).toEqual(porto);
    expect(getWeather).toHaveBeenCalledOnce();
    expect(getWeather).toHaveBeenCalledWith(porto);
  });

  it('ignores a forecast response from a previously selected city', async () => {
    vi.mocked(searchCities).mockResolvedValue([lisbon, porto]);
    const forecastResolvers: Array<(data: WeatherData) => void> = [];
    vi.mocked(getWeather).mockImplementation(
      () => new Promise((resolve) => forecastResolvers.push(resolve)),
    );
    const { result } = renderHook(() => useWeather());
    let searchTask!: Promise<void>;

    act(() => {
      searchTask = result.current.search('Portugal');
    });
    await waitFor(() => expect(getWeather).toHaveBeenCalledTimes(1));

    let portoSelection!: Promise<void>;
    act(() => {
      portoSelection = result.current.selectCity(porto);
    });
    expect(getWeather).toHaveBeenCalledTimes(2);

    await act(async () => {
      forecastResolvers[1](weatherFor(porto));
      await portoSelection;
    });
    await act(async () => {
      forecastResolvers[0](weatherFor(lisbon));
      await searchTask;
    });

    expect(result.current.status).toBe('success');
    expect(result.current.data?.city).toEqual(porto);
  });

  it('loads weather for the first city returned by search', async () => {
    vi.mocked(searchCities).mockResolvedValue([lisbon, porto]);
    vi.mocked(getWeather).mockImplementation(async (city) => weatherFor(city));
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('Portugal');
    });

    expect(result.current.status).toBe('success');
    expect(result.current.cities).toEqual([lisbon, porto]);
    expect(result.current.data?.city).toEqual(lisbon);
    expect(getWeather).toHaveBeenCalledOnce();
    expect(getWeather).toHaveBeenCalledWith(lisbon);
  });

  it('sets empty without requesting weather when search has no cities', async () => {
    vi.mocked(searchCities).mockResolvedValue([]);
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('No such city');
    });

    expect(result.current.status).toBe('empty');
    expect(result.current.cities).toEqual([]);
    expect(result.current.data).toBeNull();
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('retries the last geocoding operation after an error', async () => {
    vi.mocked(searchCities)
      .mockRejectedValueOnce(
        new WeatherServiceError(
          'network',
          'Não foi possível conectar ao serviço meteorológico. Verifique sua conexão e tente novamente.',
        ),
      )
      .mockResolvedValueOnce([lisbon]);
    vi.mocked(getWeather).mockImplementation(async (city) => weatherFor(city));
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('Lisboa');
    });
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe(
      'Não foi possível conectar ao serviço meteorológico. Verifique sua conexão e tente novamente.',
    );

    await act(async () => {
      result.current.retry();
    });

    expect(searchCities).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe('success');
    expect(result.current.data?.city).toEqual(lisbon);
  });

  it('retries the last forecast operation after an error', async () => {
    vi.mocked(searchCities).mockResolvedValue([lisbon]);
    vi.mocked(getWeather)
      .mockRejectedValueOnce(
        new WeatherServiceError(
          'network',
          'Não foi possível conectar ao serviço meteorológico. Verifique sua conexão e tente novamente.',
        ),
      )
      .mockResolvedValueOnce(weatherFor(lisbon));
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('Lisboa');
    });
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe(
      'Não foi possível conectar ao serviço meteorológico. Verifique sua conexão e tente novamente.',
    );

    await act(async () => {
      result.current.retry();
    });

    expect(searchCities).toHaveBeenCalledOnce();
    expect(getWeather).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe('success');
    expect(result.current.data?.city).toEqual(lisbon);
  });

  it('does not expose an unexpected technical error message to the user', async () => {
    vi.mocked(searchCities).mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('Lisboa');
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('Não foi possível concluir a busca. Tente novamente.');
  });
});
