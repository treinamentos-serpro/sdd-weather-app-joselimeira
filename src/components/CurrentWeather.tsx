import { formatTemperature, formatTime } from '../lib/format';
import { convertTemperature } from '../lib/temperature';
import { getWeatherCondition } from '../lib/weatherCodes';
import type { City, CurrentWeather as CurrentWeatherData, Unit } from '../types/weather';

interface CurrentWeatherProps {
  city: City;
  current: CurrentWeatherData;
  unit: Unit;
}
function formatMetric(value: number | null | undefined, suffix: string): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'Indisponível';
  const formatted = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value);
  return suffix === '%' ? `${formatted}${suffix}` : `${formatted} ${suffix}`;
}

export default function CurrentWeather({ city, current, unit }: CurrentWeatherProps) {
  const condition =
    typeof current.weatherCode !== 'number' || !Number.isFinite(current.weatherCode)
      ? { label: 'Condição indisponível', icon: '○' }
      : getWeatherCondition(current.weatherCode);
  const symbol = unit === 'celsius' ? '°C' : '°F';
  const temperature =
    typeof current.temperatureCelsius === 'number' && Number.isFinite(current.temperatureCelsius)
      ? current.temperatureCelsius
      : null;
  const observationTime =
    typeof current.time === 'string' && Number.isFinite(Date.parse(current.time))
      ? current.time
      : null;
  const metrics = [
    { label: 'Umidade', value: formatMetric(current.relativeHumidity, '%') },
    { label: 'Vento', value: formatMetric(current.windSpeedKmh, 'km/h') },
    { label: 'Precipitação', value: formatMetric(current.precipitationMm, 'mm') },
    { label: 'Pressão', value: formatMetric(current.pressureHpa, 'hPa') },
  ];

  return (
    <section
      className="current-card grid gap-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md"
      aria-labelledby="current-title"
    >
      <div>
        <p className="eyebrow mb-2 text-sm font-medium text-white/65">Agora em</p>
        <h2 id="current-title" className="break-words text-2xl font-semibold text-white">
          {city.name}
        </h2>
        <p className="location text-sm text-white/75">
          {[city.admin1, city.country].filter(Boolean).join(', ')}
        </p>
      </div>
      <div className="current-reading flex min-w-0 items-center gap-3 text-left sm:gap-4">
        <span className="weather-icon text-5xl" aria-hidden="true">
          {condition.icon}
        </span>
        <div className="grid gap-2">
          <strong className="break-words text-4xl font-semibold leading-none text-white sm:text-6xl lg:text-7xl">
            {temperature === null
              ? 'Indisponível'
              : formatTemperature(convertTemperature(temperature, unit), symbol)}
          </strong>
          <span className="text-base text-white/80">{condition.label}</span>
        </div>
      </div>
      <dl className="col-span-full grid min-w-0 grid-cols-2 gap-x-4 gap-y-4 border-t border-white/10 pt-5 sm:grid-cols-4 sm:gap-x-6">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <dt className="mb-1 text-sm text-white/75">{metric.label}</dt>
            <dd className="m-0 font-medium text-white">{metric.value}</dd>
          </div>
        ))}
      </dl>
      <p className="updated text-xs text-white/75">
        {observationTime
          ? `Atualizado às ${formatTime(observationTime)}`
          : 'Horário da observação indisponível'}
      </p>
    </section>
  );
}
