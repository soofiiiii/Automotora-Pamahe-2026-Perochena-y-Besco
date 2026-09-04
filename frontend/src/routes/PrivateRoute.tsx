import { Navigate, Outlet, useLocation } from "react-router-dom";
import { hasAnyRole, type AppRole } from "../config/permissions";
import { useAuth } from "../hooks/useAuth";

export default function PrivateRoute({ roles }: { roles?: AppRole[] }) {
  const { isAuthenticated, session } = useAuth();
  const location = useLocation();
  if (!isAuthenticated)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !hasAnyRole(session?.roles ?? [], roles))
    return <Navigate to="/app" replace />;
  return <Outlet />;
}

