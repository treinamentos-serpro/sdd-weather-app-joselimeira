import { type KeyboardEvent, useRef } from 'react';
import type { Unit } from '../types/weather';

interface UnitToggleProps {
  unit: Unit;
  onChange: (unit: Unit) => void;
}
export default function UnitToggle({ unit, onChange }: UnitToggleProps) {
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const units: Unit[] = ['celsius', 'fahrenheit'];

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (index + 1) % units.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (index - 1 + units.length) % units.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = units.length - 1;
    }

    if (nextIndex === null) return;
    event.preventDefault();
    onChange(units[nextIndex]);
    buttons.current[nextIndex]?.focus();
  };

  return (
    <div className="unit-toggle">
      <p className="mb-2 text-xs text-white/75">Unidade de temperatura</p>
      <div
        role="group"
        aria-label="Unidade de temperatura"
        className="inline-flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1 backdrop-blur-md"
      >
        <button
          type="button"
          ref={(element) => {
            buttons.current[0] = element;
          }}
          aria-pressed={unit === 'celsius'}
          tabIndex={unit === 'celsius' ? 0 : -1}
          className={`rounded-lg px-3 py-2 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${unit === 'celsius' ? 'active bg-accent-600' : 'bg-transparent hover:bg-white/10'}`}
          onClick={() => onChange('celsius')}
          onKeyDown={(event) => handleKeyDown(event, 0)}
        >
          °C
        </button>
        <button
          type="button"
          ref={(element) => {
            buttons.current[1] = element;
          }}
          aria-pressed={unit === 'fahrenheit'}
          tabIndex={unit === 'fahrenheit' ? 0 : -1}
          className={`rounded-lg px-3 py-2 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${unit === 'fahrenheit' ? 'active bg-accent-600' : 'bg-transparent hover:bg-white/10'}`}
          onClick={() => onChange('fahrenheit')}
          onKeyDown={(event) => handleKeyDown(event, 1)}
        >
          °F
        </button>
      </div>
    </div>
  );
}
