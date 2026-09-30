interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = 'Carregando...' }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-24 items-center justify-center gap-3 rounded-lg border border-white/10 bg-white/5 p-5 text-center text-white/85 backdrop-blur-md"
    >
      <span
        className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-accent-400"
        aria-hidden="true"
      />
      <span>{message}</span>
    </div>
  );
}
