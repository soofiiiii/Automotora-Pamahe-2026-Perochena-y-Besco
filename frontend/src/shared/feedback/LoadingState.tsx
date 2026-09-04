export function LoadingState({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="state-card" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}
