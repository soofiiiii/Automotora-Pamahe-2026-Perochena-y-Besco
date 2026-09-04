import type { PropsWithChildren } from "react";

export function ConfirmButton({
  children,
  onConfirm,
  className = "button button--danger",
}: PropsWithChildren<{ onConfirm: () => void; className?: string }>) {
  return (
    <button
      className={className}
      type="button"
      onClick={() => {
        if (window.confirm("¿Confirmás esta acción?")) onConfirm();
      }}
    >
      {children}
    </button>
  );
}
