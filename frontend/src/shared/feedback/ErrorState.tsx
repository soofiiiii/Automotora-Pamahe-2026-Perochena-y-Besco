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
    <div className="state-card state-card--error" role="alert">
      <CircleAlert aria-hidden="true" />
      <strong>{title}</strong>
      {description && <p>{description}</p>}
      {onRetry && (
        <button className="button button--secondary" type="button" onClick={onRetry}>
          <RefreshCw size={17} />
          Reintentar
        </button>
      )}
    </div>
  );
}
