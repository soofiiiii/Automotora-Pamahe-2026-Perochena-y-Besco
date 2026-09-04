import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import {
  CheckCircle2,
  CircleAlert,
  Info,
  X,
} from "lucide-react";

import {
  ToastContext,
  type ToastType,
} from "./toastContext";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = crypto.randomUUID();

      setToasts((previous) => [
        ...previous,
        {
          id,
          type,
          message,
        },
      ]);

      window.setTimeout(() => {
        setToasts((previous) =>
          previous.filter((toast) => toast.id !== id),
        );
      }, 4200);
    },
    [],
  );

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          message: string;
          type?: ToastType;
        }>
      ).detail;

      if (detail) {
        show(detail.message, detail.type);
      }
    };

    window.addEventListener("pamahe:toast", handler);

    return () => {
      window.removeEventListener("pamahe:toast", handler);
    };
  }, [show]);

  const api = useMemo(
    () => ({
      show,
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}

      <div
        className="toast-stack"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            className={`toast toast--${toast.type}`}
            key={toast.id}
          >
            {toast.type === "success" ? (
              <CheckCircle2 />
            ) : toast.type === "error" ? (
              <CircleAlert />
            ) : (
              <Info />
            )}

            <span>{toast.message}</span>

            <button
              className="icon-button"
              type="button"
              onClick={() =>
                setToasts((previous) =>
                  previous.filter(
                    (current) => current.id !== toast.id,
                  ),
                )
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