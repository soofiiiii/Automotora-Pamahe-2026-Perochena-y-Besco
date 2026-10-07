import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import { ToastContext, type ToastType } from "./toastContext";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

const tone: Record<ToastType, string> = {
  success: "border-emerald-200 bg-white text-slate-800 [&_.toast-icon]:bg-emerald-100 [&_.toast-icon]:text-emerald-700",
  error: "border-red-200 bg-white text-slate-800 [&_.toast-icon]:bg-red-100 [&_.toast-icon]:text-red-700",
  info: "border-blue-200 bg-white text-slate-800 [&_.toast-icon]:bg-blue-100 [&_.toast-icon]:text-blue-700",
};

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: ToastType = "info") => {
    const id = crypto.randomUUID();
    setToasts((previous) => [...previous, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((previous) => previous.filter((toast) => toast.id !== id));
    }, 4200);
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ message: string; type?: ToastType }>).detail;
      if (detail) show(detail.message, detail.type);
    };
    window.addEventListener("pamahe:toast", handler);
    return () => window.removeEventListener("pamahe:toast", handler);
  }, [show]);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="toast-stack pointer-events-none fixed bottom-4 right-4 z-[1000] grid w-[min(420px,calc(100vw-2rem))] gap-2.5"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            className={`pointer-events-auto grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border p-3.5 shadow-[0_16px_42px_rgba(15,23,42,0.16)] backdrop-blur ${tone[toast.type]}`}
            key={toast.id}
          >
            <span className="toast-icon grid size-9 place-items-center rounded-xl">
              {toast.type === "success" ? (
                <CheckCircle2 className="size-5" />
              ) : toast.type === "error" ? (
                <CircleAlert className="size-5" />
              ) : (
                <Info className="size-5" />
              )}
            </span>
            <span className="text-sm font-semibold leading-5">{toast.message}</span>
            <button
              className="grid size-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              type="button"
              onClick={() =>
                setToasts((previous) => previous.filter((current) => current.id !== toast.id))
              }
              aria-label="Cerrar"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
