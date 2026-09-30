import type { ForecastDay, Unit } from '../types/weather';
import ForecastCard from './ForecastCard';

interface ForecastListProps {
  forecast: ForecastDay[];
  unit: Unit;
}
export default function ForecastList({ forecast, unit }: ForecastListProps) {
  return (
    <section aria-labelledby="forecast-title">
      <div className="section-heading">
        <h2 id="forecast-title">Previsão de 5 dias</h2>
        <span>Máxima / mínima</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {forecast.map((day, index) => (
          <ForecastCard key={day.date} day={day} unit={unit} index={index} />
        ))}
      </div>
    </section>
  );
}
