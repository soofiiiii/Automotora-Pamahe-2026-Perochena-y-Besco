import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

export function Button({
  children,
  className = "",
  ...props
}: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition-all duration-200 hover:-translate-y-px hover:bg-brand-deep hover:shadow-md disabled:pointer-events-none disabled:opacity-55 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
