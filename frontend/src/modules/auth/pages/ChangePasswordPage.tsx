import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { authService } from "../../../services/api";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { useToast } from "../../../shared/feedback/useToast";
import { PasswordForm } from "../components/PasswordForm";

export default function ChangePasswordPage() {
    const { session, logout } = useAuth();
    const navigate = useNavigate();
    const { show } = useToast();
    return (
        <>
        <PageHeader
        title="Cambiar mi contraseña"
        description={`Cuenta: ${session?.username ?? ""}. Después del cambio vas a tener que iniciar sesión nuevamente.`}
      />
      {session?.debeCambiarPassword && (
        <p className="notice notice--warning" role="status">
          Tu cuenta requiere una nueva contraseña antes de continuar.
        </p>
      )}<PasswordForm
        requireCurrent
        label="Cambiar contraseña"
        onSave={async (values) => {
          await authService.changePassword(values);
          logout();
          navigate("/login", { replace: true });
          show(
            "Contraseña actualizada. Ingresá nuevamente con tu nueva clave.",
            "success",
          );
        }}
      />
    </>
  );
}