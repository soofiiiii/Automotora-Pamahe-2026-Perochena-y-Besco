import { CarFront } from "lucide-react";

export function AppLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="app-logo">
      <span className="app-logo__mark">
        <CarFront />
      </span>
      {!compact && (
        <span>
          <b>Pamahe</b>
          <small>Automotora</small>
        </span>
      )}
    </div>
  );
}
