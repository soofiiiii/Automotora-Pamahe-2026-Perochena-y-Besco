export function LoadingState({ label = "Cargando…" }: { label?: string }) {
  return (
    <div
      className="state-card min-h-56 rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-sm"
      role="status"
      aria-live="polite"
    >
      <div className="spinner" aria-hidden="true" />
      <p className="m-0 text-sm font-semibold text-slate-500">{label}</p>
    </div>
  );
}
