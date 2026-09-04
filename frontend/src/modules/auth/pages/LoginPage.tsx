import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../../../hooks/useAuth";
import { FormField } from "../../../shared/forms/FormField";
import { errorMessage } from "../../../utils/errorMessage";

const schema = z.object({
  username: z.string().trim().min(1, "Ingresá tu usuario").max(80),
  password: z.string().min(1, "Ingresá tu contraseña").max(120),
});

type Values = z.infer<typeof schema>;

export default function LoginPage() {
  const { login, loading } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" },
  });

  return (
    <section>
      <span className="eyebrow">Acceso del personal</span>
      <h1 style={{ marginTop: 8 }}>Ingresar</h1>
      <p className="muted">Usá únicamente las credenciales asignadas a tu cuenta.</p>
      <div className="login-security-note"><ShieldCheck size={17} />La sesión se cierra automáticamente tras un período de inactividad.</div>
      {error && <div className="notice notice--warning" role="alert">{error}</div>}
      <form
        className="grid auth-form"
        onSubmit={handleSubmit(async (v) => {
          setError("");
          try {
            await login(v.username, v.password);
            const from = (loc.state as { from?: string } | null)?.from;
            nav(from || "/app", { replace: true });
          } catch (e) {
            setError(errorMessage(e, "Usuario o contraseña incorrectos."));
          }
        })}
      >
        <FormField label="Usuario" error={errors.username?.message}>
          <div className="input-icon">
            <UserRound size={18} aria-hidden="true" />
            <input autoComplete="username" autoCapitalize="none" spellCheck={false} {...register("username")} />
          </div>
        </FormField>
        <FormField label="Contraseña" error={errors.password?.message}>
          <div className="input-icon input-icon--action">
            <LockKeyhole size={18} aria-hidden="true" />
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              {...register("password")}
            />
            <button
              className="icon-button"
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </FormField>
        <button className="button button--accent" disabled={loading} type="submit">
          {loading ? "Ingresando…" : "Ingresar al sistema"}
        </button>
      </form>
    </section>
  );
}
