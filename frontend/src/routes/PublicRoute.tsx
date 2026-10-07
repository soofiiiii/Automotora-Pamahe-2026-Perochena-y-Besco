import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { LoadingState } from "../shared/feedback/LoadingState";

export default function PublicRoute() {
  const { isAuthenticated, initializing } = useAuth();

  if (initializing) {
    return <LoadingState label="Validando sesión…" />;
  }

  return isAuthenticated ? <Navigate to="/app" replace /> : <Outlet />;
}