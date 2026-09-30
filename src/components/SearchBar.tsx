import { type FormEvent, useState } from 'react';
import type { City } from '../types/weather';

interface SearchBarProps {
  query: string;
  results: City[];
  disabled: boolean;
  validationMessage: string | null;
  onQueryChange: (value: string) => void;
  onSearch: (city: string) => void;
  onSelect: (city: City) => void;
}
export default function SearchBar({
  query,
  results,
  disabled,
  validationMessage,
  onQueryChange,
  onSearch,
  onSelect,
}: SearchBarProps) {
  const [inputError, setInputError] = useState<string | null>(null);
  const feedbackMessage = validationMessage ?? inputError;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled) return;
    const city = query.trim();
    if (!city) {
      setInputError('Informe o nome de uma cidade.');
      return;
    }
    setInputError(null);
    onSearch(city);
  };
  return (
    <section
      aria-labelledby="search-title"
      aria-busy={disabled}
      className="search-section rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md"
    >
      <h2 id="search-title" className="mb-4 text-lg font-semibold text-white">
        Encontre uma cidade
      </h2>
      <form
        onSubmit={handleSubmit}
        className="search-form"
        role="search"
        aria-label="Buscar cidade"
      >
        <label htmlFor="city-search" className="mb-2 block text-sm font-semibold text-white/85">
          Nome da cidade
        </label>
        <div className="search-row">
          <input
            id="city-search"
            value={query}
            onChange={(event) => {
              setInputError(null);
              onQueryChange(event.target.value);
            }}
            placeholder="Ex.: São Paulo"
            autoComplete="off"
            disabled={disabled}
            aria-invalid={feedbackMessage ? true : undefined}
            className="min-w-0 flex-1 rounded-lg border border-white/15 bg-night-900/60 px-4 py-3 text-white placeholder:text-white/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 disabled:cursor-not-allowed disabled:opacity-60"
            aria-describedby={feedbackMessage ? 'search-feedback' : undefined}
          />
          <button
            type="submit"
            disabled={disabled}
            className="rounded-lg bg-accent-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-accent-400 hover:text-night-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-accent-600 disabled:hover:text-white"
          >
            {disabled ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        {feedbackMessage && (
          <p id="search-feedback" className="feedback" role="alert">
            {feedbackMessage}
          </p>
        )}
      </form>
      {results.length > 0 && (
        <ul className="results mt-4 grid list-none gap-2 p-0" aria-label="Resultados da busca">
          {results.map((city) => (
            <li key={`${city.id}-${city.latitude}`}>
              <button
                type="button"
                className="result-item flex w-full items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-left text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
                onClick={() => onSelect(city)}
              >
                <span>{city.name}</span>
                <small className="text-white/80">
                  {[city.admin1, city.country].filter(Boolean).join(', ')}
                </small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
