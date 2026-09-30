import { useEffect, useRef, useState } from 'react';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import UnitToggle from './components/UnitToggle';
import useWeather from './hooks/useWeather';
import type { Unit } from './types/weather';
export default function App() {
  const weather = useWeather();
  const [unit, setUnit] = useState<Unit>('celsius');
  const weatherResultsRef = useRef<HTMLElement>(null);
  const isLoading = weather.status === 'loading';

  useEffect(() => {
    if (weather.status === 'success') weatherResultsRef.current?.focus();
  }, [weather.status]);

  return (
    <main className="app-shell">
      <header className="mb-8 grid gap-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="brand-kicker">WEATHER / NOW</p>
            <h1>Clima claro para seus planos.</h1>
            <p>Consulte as condições atuais e os próximos cinco dias.</p>
          </div>
          <UnitToggle unit={unit} onChange={setUnit} />
        </div>
        <SearchBar
          query={weather.query}
          results={weather.cities}
          disabled={isLoading}
          validationMessage={weather.status === 'idle' ? weather.error : null}
          onQueryChange={weather.setQuery}
          onSearch={weather.search}
          onSelect={weather.selectCity}
        />
      </header>
      {weather.status === 'idle' && !weather.error && (
        <div className="welcome" role="status">
          <p>Digite uma cidade para consultar o clima atual e a previsão.</p>
        </div>
      )}
      {isLoading && <LoadingState message="Carregando dados meteorológicos..." />}
      {!isLoading && weather.status === 'empty' && <EmptyState />}
      {!isLoading && weather.status === 'error' && (
        <ErrorState
          message={weather.error ?? 'Não foi possível carregar os dados.'}
          onRetry={weather.retry}
        />
      )}
      {weather.status === 'success' && weather.data && (
        <section
          ref={weatherResultsRef}
          tabIndex={-1}
          className="weather-content focus:outline-none focus:ring-2 focus:ring-accent-400 focus:ring-offset-4 focus:ring-offset-night-900"
          aria-label="Condições meteorológicas"
        >
          <CurrentWeather city={weather.data.city} current={weather.data.current} unit={unit} />
          <ForecastList forecast={weather.data.forecast} unit={unit} />
        </section>
      )}
    </main>
  );
}
