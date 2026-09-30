import type { City, CurrentWeather, ForecastDay, WeatherData } from '../types/weather';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const REQUEST_TIMEOUT_MS = 10_000;
export type WeatherServiceErrorKind = 'network' | 'timeout' | 'invalid' | 'http';

export class WeatherServiceError extends Error {
  readonly kind: WeatherServiceErrorKind;
  readonly statusCode?: number;
  constructor(kind: WeatherServiceErrorKind, message: string, statusCode?: number) {
    super(message);
    this.name = 'WeatherServiceError';
    this.kind = kind;
    this.statusCode = statusCode;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

function isAbortError(error: unknown): boolean {
  return isRecord(error) && error.name === 'AbortError';
}

async function requestJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new WeatherServiceError(
        'http',
        'O serviço meteorológico está indisponível. Tente novamente.',
        response.status,
      );
    }
    try {
      return await response.json();
    } catch (error) {
      if (isAbortError(error)) {
        throw new WeatherServiceError('timeout', 'A conexão demorou demais. Tente novamente.');
      }
      if (error instanceof TypeError) {
        throw new WeatherServiceError(
          'network',
          'Não foi possível conectar ao serviço meteorológico. Verifique sua conexão e tente novamente.',
        );
      }
      throw new WeatherServiceError('invalid', 'O serviço retornou uma resposta inválida.');
    }
  } catch (error) {
    if (error instanceof WeatherServiceError) throw error;
    if (isAbortError(error)) {
      throw new WeatherServiceError('timeout', 'A conexão demorou demais. Tente novamente.');
    }
    throw new WeatherServiceError(
      'network',
      'Não foi possível conectar ao serviço meteorológico. Verifique sua conexão e tente novamente.',
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

function normalizeCity(value: unknown): City | null {
  if (
    !isRecord(value) ||
    !isNumber(value.latitude) ||
    value.latitude < -90 ||
    value.latitude > 90 ||
    !isNumber(value.longitude) ||
    value.longitude < -180 ||
    value.longitude > 180
  )
    return null;
  if (typeof value.name !== 'string' || value.name.trim() === '') return null;
  return {
    id: typeof value.id === 'number' || typeof value.id === 'string' ? value.id : undefined,
    name: value.name,
    country: optionalString(value.country),
    admin1: optionalString(value.admin1),
    latitude: value.latitude,
    longitude: value.longitude,
    timezone: optionalString(value.timezone),
  };
}

export async function searchCities(name: string): Promise<City[]> {
  const cityName = name.trim();
  if (!cityName) return [];

  const params = new URLSearchParams({
    count: '5',
    language: 'pt',
    format: 'json',
  });
  const payload = await requestJson(
    `${GEOCODING_URL}?name=${encodeURIComponent(cityName)}&${params}`,
  );
  if (!isRecord(payload))
    throw new WeatherServiceError('invalid', 'Não foi possível interpretar os resultados.');
  if (!('results' in payload) || payload.results === null) return [];
  if (!Array.isArray(payload.results))
    throw new WeatherServiceError('invalid', 'Não foi possível interpretar os resultados.');
  return payload.results.map(normalizeCity).filter((city): city is City => city !== null);
}

function normalizeCurrent(value: unknown): CurrentWeather {
  const current = isRecord(value) ? value : {};
  const timestamp = optionalString(current.time);
  return {
    time: timestamp && Number.isFinite(Date.parse(timestamp)) ? timestamp : null,
    temperatureCelsius: isNumber(current.temperature_2m) ? current.temperature_2m : null,
    weatherCode: isNumber(current.weather_code) ? current.weather_code : null,
    isDay: current.is_day === 1 ? true : current.is_day === 0 ? false : null,
    relativeHumidity: isNumber(current.relative_humidity_2m) ? current.relative_humidity_2m : null,
    windSpeedKmh: isNumber(current.wind_speed_10m) ? current.wind_speed_10m : null,
    precipitationMm: isNumber(current.precipitation) ? current.precipitation : null,
    pressureHpa: isNumber(current.surface_pressure) ? current.surface_pressure : null,
  };
}

function normalizeForecast(value: unknown): WeatherData['forecast'] | null {
  if (!isRecord(value) || !Array.isArray(value.time) || value.time.length < 5) return null;
  const days: ForecastDay[] = [];
  for (let index = 0; index < 5; index += 1) {
    const date = value.time[index];
    if (typeof date !== 'string' || !isValidIsoDate(date)) return null;
    const min =
      Array.isArray(value.temperature_2m_min) && isNumber(value.temperature_2m_min[index])
        ? value.temperature_2m_min[index]
        : null;
    const max =
      Array.isArray(value.temperature_2m_max) && isNumber(value.temperature_2m_max[index])
        ? value.temperature_2m_max[index]
        : null;
    const code =
      Array.isArray(value.weather_code) && isNumber(value.weather_code[index])
        ? value.weather_code[index]
        : null;
    const probability = Array.isArray(value.precipitation_probability_max)
      ? value.precipitation_probability_max[index]
      : undefined;
    const precipitation = Array.isArray(value.precipitation_sum)
      ? value.precipitation_sum[index]
      : undefined;
    days.push({
      date,
      minTemperatureCelsius: min,
      maxTemperatureCelsius: max,
      weatherCode: code,
      precipitationProbability: isNumber(probability) ? probability : null,
      precipitationMm: isNumber(precipitation) ? precipitation : null,
    });
  }
  return [days[0]!, days[1]!, days[2]!, days[3]!, days[4]!];
}

export async function getWeather(city: City): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current:
      'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation,surface_pressure,is_day',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum',
    forecast_days: '5',
    timezone: 'auto',
    temperature_unit: 'celsius',
  });
  const payload = await requestJson(`${FORECAST_URL}?${params}`);
  if (!isRecord(payload))
    throw new WeatherServiceError('invalid', 'A resposta da previsão é inválida.');
  const current = normalizeCurrent(payload.current);
  const forecast = normalizeForecast(payload.daily);
  if (!forecast)
    throw new WeatherServiceError('invalid', 'A previsão não contém dados suficientes.');
  const timezone = optionalString(payload.timezone) ?? optionalString(city.timezone) ?? 'UTC';
  return {
    city,
    current,
    forecast,
    timezone,
    fetchedAt: new Date().toISOString(),
  };
}
