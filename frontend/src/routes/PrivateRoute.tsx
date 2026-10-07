import { Navigate, Outlet, useLocation } from "react-router-dom";
import { hasAnyRole, type AppRole } from "../config/permissions";
import { useAuth } from "../hooks/useAuth";
import { LoadingState } from "../shared/feedback/LoadingState";

export default function PrivateRoute({ roles }: { roles?: AppRole[] }) {
  const { isAuthenticated, session, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return <LoadingState label="Validando sesión…" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (
    session?.debeCambiarPassword &&
    location.pathname !== "/app/mi-cuenta/password"
  ) {
    return <Navigate to="/app/mi-cuenta/password" replace />;
  }

  if (roles && !hasAnyRole(session?.roles ?? [], roles)) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}