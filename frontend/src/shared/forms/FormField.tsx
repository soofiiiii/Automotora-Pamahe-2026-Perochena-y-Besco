import type { PropsWithChildren, ReactNode } from "react";

export function FormField({
  label,
  error,
  hint,
  children,
}: { label: string; error?: string; hint?: ReactNode } & PropsWithChildren) {
  return (
    <label className="field grid gap-2 text-sm font-semibold text-slate-800">
      <span className="flex items-center gap-2 text-[0.82rem] font-extrabold tracking-[-0.01em] text-slate-700">
        {label}
      </span>
      {children}
      {hint && <small className="text-xs font-medium leading-5 text-slate-500">{hint}</small>}
      {error && (
        <small
          className="field__error inline-flex items-start gap-1.5 rounded-lg bg-red-50 px-2.5 py-2 text-xs font-semibold leading-4 text-red-700 ring-1 ring-inset ring-red-200"
          role="alert"
        >
          {error}
        </small>
      )}
    </label>
  );
}
