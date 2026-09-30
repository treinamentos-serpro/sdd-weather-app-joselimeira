interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="grid justify-items-center gap-4 rounded-lg border border-rose-300/20 bg-rose-400/5 p-5 text-center text-rose-100 backdrop-blur-md"
    >
      <p className="m-0">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-lg bg-rose-800 px-4 py-2 font-semibold text-white transition-colors hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        Tentar novamente
      </button>
    </div>
  );
}
