import type { PropsWithChildren } from "react";
import { useConfirmDialog } from "../feedback/useConfirmDialog";

export function ConfirmButton({
  children,
  onConfirm,
  className = "button button--danger",
}: PropsWithChildren<{ onConfirm: () => void; className?: string }>) {
  const { confirm } = useConfirmDialog();

  return (
    <button
      className={className}
      type="button"
      onClick={async () => {
        const accepted = await confirm({
          title: "Confirmar acción",
          message: "Esta acción puede modificar o retirar información del sistema.",
        });
        if (accepted) onConfirm();
      }}
    >
      {children}
    </button>
  );
}
