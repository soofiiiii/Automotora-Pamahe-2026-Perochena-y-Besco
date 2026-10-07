import { ChevronLeft, ChevronRight } from "lucide-react";

export function PaginationControls({
  page,
  totalPages,
  totalElements,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      className="pagination mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm"
      aria-label="Paginación de resultados"
    >
      <button
        type="button"
        className="button button--secondary"
        disabled={page <= 0}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft size={17} aria-hidden="true" />
        Anterior
      </button>
      <span className="text-center text-sm font-semibold text-slate-600" aria-live="polite">
        Página <strong className="text-slate-900">{page + 1}</strong> de{" "}
        <strong className="text-slate-900">{totalPages}</strong>
        <small className="ml-2 text-xs font-medium text-slate-400">
          {totalElements} resultados
        </small>
      </span>
      <button
        type="button"
        className="button button--secondary"
        disabled={page >= totalPages - 1}
        onClick={() => onPageChange(page + 1)}
      >
        Siguiente
        <ChevronRight size={17} aria-hidden="true" />
      </button>
    </nav>
  );
}
