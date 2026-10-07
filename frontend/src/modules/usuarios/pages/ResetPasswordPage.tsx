import { useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { usuarioService } from "../../../services/api";
import { useAuth } from "../../../hooks/useAuth";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { LoadingState } from "../../../shared/feedback/LoadingState";
import { ErrorState } from "../../../shared/feedback/ErrorState";
import { useToast } from "../../../shared/feedback/useToast";
import { PasswordForm } from "../../auth/components/PasswordForm";

export default function ResetPasswordPage() {
  const id = Number(useParams().id);
  const load = useCallback(async () => {
    if (!Number.isSafeInteger(id) || id <= 0)
      throw new Error("El enlace del usuario no es válido.");
    return usuarioService.get(id);
  }, [id]);
  const { data: user, loading, error, retry } = useApiQuery(load);
  const { session, logout } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  if (loading) return <LoadingState />;
  if (!user || error) return <ErrorState description={error} onRetry={retry} />;
  return (
    <>
      <PageHeader
        title="Restablecer contraseña"
        description={`${user.nombre} · @${user.username}`}
        actions={
          <Link className="button button--secondary" to="/app/usuarios">
            Volver a usuarios
          </Link>
        }
      />
      <p className="notice">
        Establecé una clave temporal y entregala al titular por un canal seguro.
        La cuenta deberá cambiarla al iniciar sesión.
      </p>
      <PasswordForm
        key={id}
        label={`Restablecer clave de ${user.username}`}
        onSave={async ({ nuevaPassword }) => {
          await usuarioService.resetPassword(id, { nuevaPassword });
          if (user.username === session?.username) {
            logout();
            navigate("/login", { replace: true });
          } else navigate("/app/usuarios");
          show(
            "Contraseña restablecida. El usuario deberá cambiarla la próxima vez que ingrese.",
            "success",
          );
        }}
      />
    </>
  );
}
