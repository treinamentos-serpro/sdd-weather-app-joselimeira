import { useCallback, useRef, useState } from 'react';
import { getWeather, searchCities, WeatherServiceError } from '../services/weatherService';
import type { City, WeatherData } from '../types/weather';

export type WeatherStatus = 'idle' | 'loading' | 'success' | 'error' | 'empty';

export interface WeatherState {
  status: WeatherStatus;
  data: WeatherData | null;
  cities: City[];
  error: string | null;
  query: string;
}

type LastOperation = { kind: 'search'; name: string } | { kind: 'forecast'; city: City };

const initialState: WeatherState = {
  status: 'idle',
  data: null,
  cities: [],
  error: null,
  query: '',
};

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof WeatherServiceError ? error.message : fallback;
}

function isSameCity(left: City | null, right: City): boolean {
  if (!left) return false;
  if (left.id !== undefined && right.id !== undefined) return left.id === right.id;
  return left.latitude === right.latitude && left.longitude === right.longitude;
}

export default function useWeather() {
  const [state, setState] = useState<WeatherState>(initialState);
  const operation = useRef(0);
  const pendingSearch = useRef<{ name: string; operation: number } | null>(null);
  const pendingCity = useRef<City | null>(null);
  const selectedCity = useRef<City | null>(null);
  const dataRef = useRef<WeatherData | null>(null);
  const lastOperation = useRef<LastOperation | null>(null);

  const setQuery = useCallback((query: string) => {
    setState((current) => ({
      ...current,
      query,
      error: current.status === 'idle' ? null : current.error,
    }));
  }, []);

  const loadWeather = useCallback(async (city: City, currentOperation: number) => {
    selectedCity.current = city;
    pendingCity.current = city;
    dataRef.current = null;
    lastOperation.current = { kind: 'forecast', city };
    setState((current) => ({ ...current, status: 'loading', data: null, error: null }));

    try {
      const data = await getWeather(city);
      if (currentOperation !== operation.current) return;
      dataRef.current = data;
      setState((current) => ({ ...current, status: 'success', data, error: null }));
    } catch (error) {
      if (currentOperation !== operation.current) return;
      const message = getErrorMessage(
        error,
        'Não foi possível carregar a previsão. Tente novamente.',
      );
      setState((current) => ({ ...current, status: 'error', data: null, error: message }));
    } finally {
      if (currentOperation === operation.current) pendingCity.current = null;
    }
  }, []);

  const search = useCallback(
    async (name: string) => {
      const cityName = name.trim();
      setState((current) => ({ ...current, query: name }));

      if (!cityName) {
        operation.current += 1;
        pendingSearch.current = null;
        pendingCity.current = null;
        selectedCity.current = null;
        dataRef.current = null;
        lastOperation.current = null;
        setState({
          ...initialState,
          query: name,
          error: 'Informe o nome de uma cidade.',
        });
        return;
      }

      if (pendingSearch.current?.name === cityName) return;

      const currentOperation = ++operation.current;
      pendingSearch.current = { name: cityName, operation: currentOperation };
      pendingCity.current = null;
      selectedCity.current = null;
      dataRef.current = null;
      lastOperation.current = { kind: 'search', name: cityName };
      setState({ status: 'loading', data: null, cities: [], error: null, query: name });

      try {
        const cities = await searchCities(cityName);
        if (currentOperation !== operation.current) return;

        setState((current) => ({ ...current, cities }));
        if (cities.length === 0) {
          setState((current) => ({ ...current, status: 'empty', data: null, error: null }));
          return;
        }

        await loadWeather(cities[0], currentOperation);
      } catch (error) {
        if (currentOperation !== operation.current) return;
        const message = getErrorMessage(
          error,
          'Não foi possível concluir a busca. Tente novamente.',
        );
        setState((current) => ({ ...current, status: 'error', data: null, error: message }));
      } finally {
        if (pendingSearch.current?.operation === currentOperation) pendingSearch.current = null;
      }
    },
    [loadWeather],
  );

  const selectCity = useCallback(
    async (city: City) => {
      if (
        isSameCity(pendingCity.current, city) ||
        (dataRef.current && isSameCity(dataRef.current.city, city))
      ) {
        return;
      }

      const currentOperation = ++operation.current;
      pendingSearch.current = null;
      await loadWeather(city, currentOperation);
    },
    [loadWeather],
  );

  const retry = useCallback(() => {
    const previous = lastOperation.current;
    if (!previous) return;
    if (previous.kind === 'search') {
      void search(previous.name);
      return;
    }
    void selectCity(previous.city);
  }, [search, selectCity]);

  return { ...state, setQuery, search, selectCity, retry };
}
