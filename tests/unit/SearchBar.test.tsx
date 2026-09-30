import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SearchBar from '../../src/components/SearchBar';

function renderSearchBar({ query = '', disabled = false, onSearch = vi.fn() } = {}) {
  return render(
    <SearchBar
      query={query}
      results={[]}
      disabled={disabled}
      validationMessage={null}
      onQueryChange={vi.fn()}
      onSearch={onSearch}
      onSelect={vi.fn()}
    />,
  );
}

describe('SearchBar', () => {
  it('exposes an accessible search form and city input label', () => {
    renderSearchBar();

    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome da cidade')).toBeInTheDocument();
  });

  it('marks the input invalid when validation feedback is shown', () => {
    render(
      <SearchBar
        query=""
        results={[]}
        disabled={false}
        validationMessage="Informe o nome de uma cidade."
        onQueryChange={vi.fn()}
        onSearch={vi.fn()}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Nome da cidade')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Nome da cidade')).toHaveAttribute(
      'aria-describedby',
      'search-feedback',
    );
  });

  it('submits the trimmed city name', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    renderSearchBar({ query: '  São Paulo  ', onSearch });

    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(onSearch).toHaveBeenCalledOnce();
    expect(onSearch).toHaveBeenCalledWith('São Paulo');
  });

  it.each(['', '   '])('does not search an empty trimmed value: %j', async (query) => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    renderSearchBar({ query, onSearch });

    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(onSearch).not.toHaveBeenCalled();
  });

  it('disables the input and submit action while disabled', () => {
    renderSearchBar({ disabled: true });

    expect(screen.getByLabelText('Nome da cidade')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Buscando...' })).toBeDisabled();
  });

  it('exposes city results as list items', () => {
    render(
      <SearchBar
        query="Lisboa"
        results={[{ id: 1, name: 'Lisboa', country: 'Portugal', latitude: 38.7, longitude: -9.1 }]}
        disabled={false}
        validationMessage={null}
        onQueryChange={vi.fn()}
        onSearch={vi.fn()}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole('list', { name: 'Resultados da busca' })).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toHaveTextContent('LisboaPortugal');
  });

  it('lets the user select the intended city among homonymous results', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const homonyms = [
      {
        id: 1,
        name: 'Springfield',
        admin1: 'Illinois',
        country: 'United States',
        latitude: 39.8,
        longitude: -89.6,
      },
      {
        id: 2,
        name: 'Springfield',
        admin1: 'Ontario',
        country: 'Canada',
        latitude: 43.0,
        longitude: -81.2,
      },
    ];
    render(
      <SearchBar
        query="Springfield"
        results={homonyms}
        disabled={false}
        validationMessage={null}
        onQueryChange={vi.fn()}
        onSearch={vi.fn()}
        onSelect={onSelect}
      />,
    );

    const cityButtons = screen.getAllByRole('button', { name: /Springfield/ });
    expect(cityButtons).toHaveLength(2);
    expect(cityButtons[0]).toHaveTextContent('Illinois, United States');
    expect(cityButtons[1]).toHaveTextContent('Ontario, Canada');
    await user.click(cityButtons[1]);

    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith(homonyms[1]);
  });
});
