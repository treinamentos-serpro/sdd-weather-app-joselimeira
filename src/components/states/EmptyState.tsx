interface EmptyStateProps {
  title?: string;
  hint?: string;
}

export default function EmptyState({
  title = 'Nenhuma cidade encontrada',
  hint = 'Confira a grafia e tente buscar novamente.',
}: EmptyStateProps) {
  return (
    <section
      role="status"
      aria-labelledby="empty-state-title"
      className="grid justify-items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-6 text-center text-white/85 backdrop-blur-md"
    >
      <h2 id="empty-state-title" className="m-0 text-lg font-semibold text-white">
        {title}
      </h2>
      <p className="m-0 text-sm text-white/75">{hint}</p>
    </section>
  );
}
