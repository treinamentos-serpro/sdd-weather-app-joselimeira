import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import EmptyState from '../../src/components/states/EmptyState';
import ErrorState from '../../src/components/states/ErrorState';
import LoadingState from '../../src/components/states/LoadingState';

describe('state components', () => {
  it('announces loading with status role', () => {
    render(<LoadingState message="Carregando previsão..." />);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando previsão...');
  });

  it('shows an error and calls retry only after activation', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState message="Falha de conexão" onRetry={onRetry} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Falha de conexão');
    expect(onRetry).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('shows an empty-state title and hint', () => {
    render(<EmptyState title="Sem resultados" hint="Tente outra cidade." />);

    expect(screen.getByRole('heading', { name: 'Sem resultados' })).toBeInTheDocument();
    expect(screen.getByText('Tente outra cidade.')).toBeInTheDocument();
  });
});
