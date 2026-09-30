export type Unit = 'celsius' | 'fahrenheit';

export interface City {
  id?: number | string;
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export interface CurrentWeather {
  time: string | null;
  temperatureCelsius: number | null;
  weatherCode: number | null;
  isDay?: boolean | null;
  relativeHumidity?: number | null;
  windSpeedKmh?: number | null;
  precipitationMm?: number | null;
  pressureHpa?: number | null;
}

export interface ForecastDay {
  date: string;
  minTemperatureCelsius: number | null;
  maxTemperatureCelsius: number | null;
  weatherCode: number | null;
  precipitationProbability?: number | null;
  precipitationMm?: number | null;
}

export interface WeatherData {
  city: City;
  current: CurrentWeather;
  forecast: [ForecastDay, ForecastDay, ForecastDay, ForecastDay, ForecastDay];
  timezone: string;
  fetchedAt: string;
}
