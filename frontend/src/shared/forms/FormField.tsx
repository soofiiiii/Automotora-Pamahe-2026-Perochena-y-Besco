import type { PropsWithChildren, ReactNode } from "react";

export function FormField({
  label,
  error,
  hint,
  children,
}: { label: string; error?: string; hint?: ReactNode } & PropsWithChildren) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
      {error && <small className="field__error">{error}</small>}
    </label>
  );
}
