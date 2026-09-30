import { formatTemperature, getDayLabel, getShortDate } from '../lib/format';
import { convertTemperature } from '../lib/temperature';
import { getWeatherCondition } from '../lib/weatherCodes';
import type { ForecastDay, Unit } from '../types/weather';

interface ForecastCardProps {
  day: ForecastDay;
  unit: Unit;
  index: number;
}
export default function ForecastCard({ day, unit, index }: ForecastCardProps) {
  const condition =
    typeof day.weatherCode !== 'number' || !Number.isFinite(day.weatherCode)
      ? { label: 'Condição indisponível', icon: '○' }
      : getWeatherCondition(day.weatherCode);
  const symbol = unit === 'celsius' ? '°C' : '°F';
  const date = typeof day.date === 'string' ? new Date(`${day.date}T00:00:00Z`) : null;
  const hasValidDate =
    date !== null &&
    Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === day.date;
  const dayLabel = hasValidDate ? getDayLabel(index, day.date) : 'Dia indisponível';
  const shortDate = hasValidDate ? getShortDate(day.date) : 'Data indisponível';
  const maximum =
    typeof day.maxTemperatureCelsius === 'number' && Number.isFinite(day.maxTemperatureCelsius)
      ? day.maxTemperatureCelsius
      : null;
  const minimum =
    typeof day.minTemperatureCelsius === 'number' && Number.isFinite(day.minTemperatureCelsius)
      ? day.minTemperatureCelsius
      : null;
  const precipitationProbability =
    typeof day.precipitationProbability === 'number' &&
    Number.isFinite(day.precipitationProbability)
      ? day.precipitationProbability
      : null;
  return (
    <article
      className="forecast-card rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
      aria-label={`Previsão para ${dayLabel}, ${shortDate}`}
    >
      <h3 className="break-words">{dayLabel}</h3>
      {hasValidDate ? (
        <time className="text-xs text-white/70" dateTime={day.date}>
          {shortDate}
        </time>
      ) : (
        <span className="text-xs text-white/70">{shortDate}</span>
      )}
      <span className="forecast-icon" aria-hidden="true">
        {condition.icon}
      </span>
      <p>{condition.label}</p>
      <div className="flex justify-center gap-4 text-sm">
        <div className="grid gap-1">
          <span className="text-xs text-white/75">Máx</span>
          <strong>
            {maximum === null
              ? 'Indisponível'
              : formatTemperature(convertTemperature(maximum, unit), symbol)}
          </strong>
        </div>
        <div className="grid gap-1">
          <span className="text-xs text-white/75">Mín</span>
          <span>
            {minimum === null
              ? 'Indisponível'
              : formatTemperature(convertTemperature(minimum, unit), symbol)}
          </span>
        </div>
      </div>
      <small className="mt-3 block break-words text-xs text-white/80">
        {precipitationProbability === null
          ? 'Chuva indisponível'
          : `Chuva ${precipitationProbability}%`}
      </small>
    </article>
  );
}
