import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { CircleAlert, X } from "lucide-react";
import {
  ConfirmDialogContext,
  type ConfirmDialogOptions,
} from "./confirmDialogContext";

type DialogState = {
  options: ConfirmDialogOptions;
  step: 1 | 2;
};

export function ConfirmDialogProvider({ children }: PropsWithChildren) {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const resolverRef = useRef<((result: boolean) => void) | null>(null);

  const close = useCallback((result: boolean) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setDialog(null);
    resolve?.(result);
  }, []);

  const confirm = useCallback((options: ConfirmDialogOptions) => {
    resolverRef.current?.(false);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setDialog({
        options: {
          destructive: true,
          requireSecondConfirm: true,
          ...options,
        },
        step: 1,
      });
    });
  }, []);

  useEffect(() => {
    if (!dialog) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => cancelRef.current?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [close, dialog]);

  const api = useMemo(() => ({ confirm }), [confirm]);

  const continueConfirmation = () => {
    if (!dialog) return;
    if (dialog.options.requireSecondConfirm !== false && dialog.step === 1) {
      setDialog({ ...dialog, step: 2 });
      window.requestAnimationFrame(() => cancelRef.current?.focus());
      return;
    }
    close(true);
  };

  return (
    <ConfirmDialogContext.Provider value={api}>
      {children}
      {dialog && (
        <div
          className="fixed inset-0 z-[1400] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-[2px]"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close(false);
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-description"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_28px_90px_rgba(15,23,42,0.32)] sm:p-6"
          >
            <div className="flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-red-100 text-red-700">
                <CircleAlert className="size-6" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h2 id="confirm-dialog-title" className="m-0 text-lg font-black text-slate-950">
                    {dialog.step === 2 ? "Confirmación final" : dialog.options.title}
                  </h2>
                  <button
                    type="button"
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Cerrar advertencia"
                    onClick={() => close(false)}
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <p id="confirm-dialog-description" className="mb-0 mt-2 text-sm leading-6 text-slate-600">
                  {dialog.step === 2
                    ? "Confirmá una vez más para ejecutar la acción. Verificá que seleccionaste el registro correcto."
                    : dialog.options.message}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                ref={cancelRef}
                type="button"
                className="button button--secondary"
                onClick={() => close(false)}
              >
                {dialog.options.cancelLabel ?? "Cancelar"}
              </button>
              <button
                type="button"
                className={dialog.options.destructive === false ? "button" : "button button--danger"}
                onClick={continueConfirmation}
              >
                {dialog.step === 2
                  ? (dialog.options.secondConfirmLabel ?? "Sí, confirmar definitivamente")
                  : (dialog.options.confirmLabel ?? "Continuar")}
              </button>
            </div>
          </section>
        </div>
      )}
    </ConfirmDialogContext.Provider>
  );
}
