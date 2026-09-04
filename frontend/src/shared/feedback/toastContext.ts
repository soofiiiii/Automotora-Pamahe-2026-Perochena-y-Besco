import { createContext } from "react";

export type ToastType = "success" | "error" | "info";

export interface ToastApi {
  show: (message: string, type?: ToastType) => void;
}

export const ToastContext = createContext<ToastApi | undefined>(undefined);