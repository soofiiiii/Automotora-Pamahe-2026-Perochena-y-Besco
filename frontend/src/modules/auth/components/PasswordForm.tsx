import { useState, type FormEvent } from "react";
import { errorMessage } from "../../../utils/errorMessage";
import { passwordValidation } from "../../../utils/passwordValidation";

export interface PasswordValues {
  passwordActual: string;
  nuevaPassword: string;
}

export function PasswordForm({
  requireCurrent = false,
  label,
  onSave,
}: {
  requireCurrent?: boolean;
  label: string;
  onSave: (values: PasswordValues) => Promise<void>;
}) {
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const validation = passwordValidation(password);
    if (validation) {
      setError(validation);
      return;
    }
    if (requireCurrent && !current) {
      setError("Ingresá tu contraseña actual.");
      return;
    }
    if (password !== confirmation) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }
    if (requireCurrent && password === current) {
      setError("La contraseña nueva no puede ser igual a la actual.");
      return;
    }
    setBusy(true);
    setError("");

    try {
        await onSave({ passwordActual: current, nuevaPassword: password });
        setCurrent("");
        setPassword("");
        setConfirmation("");
    } catch (cause) {
        setError(
          errorMessage(
            cause,
            requireCurrent
              ? "No pudimos cambiar la contraseña. Revisá la contraseña actual y los requisitos de la nueva clave."
              : "No pudimos restablecer la contraseña. Revisá la conexión y tus permisos.",
          ),
        );
        setCurrent("");
        setPassword("");
        setConfirmation("");
    } finally {
        setBusy(false);
    }
  };

  return (
    <form className="card password-form" onSubmit={submit}>
        <p id="password-rules" className="muted">
            Usá entre 8 y 72 caracteres. No reutilices ni compartas tu contraseña personal. 
        </p>
        <fieldset className="password-fields" disabled={busy}>
        <legend className="sr-only">Credenciales</legend>
        {requireCurrent && (
            <label className="field">
            <span>Contraseña actual</span>
            <input
              required
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(event) => setCurrent(event.target.value)}
            />
          </label>
        )}
        <label className="field">
          <span>Nueva contraseña</span>
          <input
            required
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            aria-describedby="password-rules"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <label className="field">
          <span>Confirmar nueva contraseña</span>
          <input
            required
            type="password"
            autoComplete="new-password"
            maxLength={72}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </label>
      </fieldset>
      {error && (
        <p className="notice notice--warning" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button className="button" type="submit" disabled={busy}>
          {busy ? "Guardando…" : label}
        </button>
      </div>
    </form>
  );
}
