import { createContext } from "react";

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  secondConfirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  requireSecondConfirm?: boolean;
}

export interface ConfirmDialogContextValue {
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
}

export const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null);
