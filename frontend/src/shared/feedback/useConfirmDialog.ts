import { useContext } from "react";
import { ConfirmDialogContext } from "./confirmDialogContext";

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error("useConfirmDialog debe utilizarse dentro de ConfirmDialogProvider.");
  }
  return context;
}
