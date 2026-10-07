import { CircleAlert, RefreshCw } from "lucide-react";

export function ErrorState({
  title = "No pudimos cargar esta información",
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="state-card state-card--error min-h-56 rounded-2xl border border-red-200 bg-[linear-gradient(145deg,#fff_0%,#fff7f7_100%)] p-8 text-center shadow-sm"
      role="alert"
    >
      <span className="grid size-12 place-items-center rounded-2xl bg-red-100 text-red-700">
        <CircleAlert className="size-6" aria-hidden="true" />
      </span>
      <strong className="text-base font-extrabold text-slate-900">{title}</strong>
      {description && <p className="m-0 max-w-xl text-sm leading-6 text-slate-600">{description}</p>}
      {onRetry && (
        <button className="button button--secondary" type="button" onClick={onRetry}>
          <RefreshCw size={17} />
          Reintentar
        </button>
      )}
    </div>
  );
}
