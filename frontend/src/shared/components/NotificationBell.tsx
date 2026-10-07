import { Bell, Check, ExternalLink } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { notificationService } from "../../services/api";
import type { Notificacion } from "../../types/domain.types";
import { errorMessage } from "../../utils/errorMessage";
import { useToast } from "../feedback/useToast";

const REFRESH_MS = 60_000;

export function NotificationBell() {
  const { show } = useToast();
  const [notifications, setNotifications] = useState<Notificacion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    return notificationService
      .list()
      .then((data) => {
        setNotifications(data);
      })
      .catch((error) => {
        show(
          errorMessage(error, "No pudimos cargar las notificaciones."),
          "error",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [show]);

  useEffect(() => {
    void load();

    const interval = window.setInterval(() => void load(), REFRESH_MS);
    const onFocus = () => void load();

    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const unread = useMemo(
    () => notifications.filter((notification) => !notification.leida).length,
    [notifications],
  );

  const markRead = async (notification: Notificacion) => {
    if (notification.leida) return;
    try {
      const updated = await notificationService.markRead(notification.id);
      setNotifications((current) =>
        current.filter((item) => item.id !== updated.id),
      );
    } catch (error) {
      show(errorMessage(error, "No pudimos actualizar la notificación."), "error");
    }
  };

  return (
    <div className="relative ml-auto sm:ml-0" ref={containerRef}>
      <button
        type="button"
        className="relative grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-brand-deep shadow-sm transition-colors hover:border-brand/20 hover:bg-brand/[0.04]"
        aria-label={unread ? `Notificaciones: ${unread} sin leer` : "Notificaciones"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="size-[18px]" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[0.62rem] font-black text-white ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="border-b border-slate-100 px-4 py-3">
            <strong className="text-sm text-slate-900">Notificaciones</strong>
            <p className="mt-0.5 text-xs text-slate-500">
              Avisos operativos que requieren revisión comercial.
            </p>
          </div>
          <div className="max-h-96 overflow-y-auto p-2">
            {loading ? (
              <p className="px-3 py-4 text-sm text-slate-500">Cargando…</p>
            ) : notifications.length === 0 ? (
              <p className="px-3 py-4 text-sm text-slate-500">
                No hay notificaciones pendientes.
              </p>
            ) : (
              notifications.map((notification) => (
                <article
                  key={notification.id}
                  className={[
                    "mb-2 rounded-xl border p-3 last:mb-0",
                    notification.leida
                      ? "border-slate-100 bg-slate-50/70"
                      : "border-brand/15 bg-brand/[0.035]",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <strong className="block text-sm text-slate-900">
                        {notification.titulo}
                      </strong>
                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        {notification.mensaje}
                      </p>
                    </div>
                    {!notification.leida && (
                      <button
                        type="button"
                        className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-white hover:text-brand"
                        title="Marcar como leída"
                        aria-label="Marcar como leída"
                        onClick={() => void markRead(notification)}
                      >
                        <Check className="size-4" />
                      </button>
                    )}
                  </div>
                  {notification.urlDestino && (
                    <Link
                      className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline"
                      to={notification.urlDestino}
                      onClick={() => setOpen(false)}
                    >
                      Abrir detalle <ExternalLink className="size-3.5" />
                    </Link>
                  )}
                </article>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
