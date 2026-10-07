import { RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { tallerOfflineService } from "../../../offline/tallerOfflineService";
import { syncQueue } from "../../../offline/syncQueue";
import {
  QUEUE_CHANGED_EVENT,
  requestBackgroundSync,
} from "../../../offline/backgroundSync";
import type { SyncStatus } from "../../../offline/indexedDb";
import { API_URL } from "../../../config/apiConfig";
import { useAuth } from "../../../hooks/useAuth";
import { useOnlineStatus } from "../../../hooks/useOnlineStatus";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { LoadingState } from "../../../shared/feedback/LoadingState";
import { ErrorState } from "../../../shared/feedback/ErrorState";
import { useToast } from "../../../shared/feedback/useToast";
import { useConfirmDialog } from "../../../shared/feedback/useConfirmDialog";
import { errorMessage } from "../../../utils/errorMessage";
import { formatDate } from "../../../utils/formatDate";

const statusLabels: Record<SyncStatus, string> = {
  pending: "Pendiente de envío",
  syncing: "Enviando",
  retry: "Pendiente de reintento",
  auth_required: "Requiere volver a iniciar sesión",
  conflict: "Requiere revisión antes de reenviar",
  failed: "Requiere corregir los datos",
  synced: "Registrada correctamente",
};

export default function OfflineQueuePage() {
  const { session } = useAuth();
  const username = session?.username ?? "";
  const online = useOnlineStatus();
  const [busy, setBusy] = useState(false);
  const [background, setBackground] = useState<boolean>();
  const [clockNow, setClockNow] = useState(0);
  const { show } = useToast();
  const { confirm } = useConfirmDialog();
  const load = useCallback(
    async () => ({
      rows: await syncQueue.list(username, API_URL),
      legacy: await syncQueue.legacy(),
    }),
    [username],
  );
  const { data, error, loading, retry } = useApiQuery(load);
  useEffect(() => {
    window.addEventListener(QUEUE_CHANGED_EVENT, retry);
    void requestBackgroundSync().then(setBackground);
    return () => window.removeEventListener(QUEUE_CHANGED_EVENT, retry);
  }, [retry]);

  useEffect(() => {
    const refreshClock = () => setClockNow(Date.now());
    const initialTimer = window.setTimeout(refreshClock, 0);
    const interval = window.setInterval(refreshClock, 1_000);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
    };
  }, []);
  const pending =
    data?.rows.filter((row) => row.status !== "synced").length ?? 0;
  const synchronize = async () => {
    setBusy(true);
    try {
      const result = await tallerOfflineService.sync(true);
      show(
        result.failed
          ? "Quedan operaciones pendientes de revisión."
          : result.synced
            ? `${result.synced} registro(s) confirmado(s).`
            : "No se confirmaron nuevos envíos. Revisá el estado de cada operación.",
        result.failed ? "info" : "success",
      );
    } catch (cause) {
      show(errorMessage(cause, "No pudimos sincronizar las operaciones pendientes."), "error");
    } finally {
      setBusy(false);
      retry();
    }
  };
  return (
    <>
      <PageHeader
        title="Operaciones pendientes"
        description="Operaciones de tu cuenta guardadas en este dispositivo y confirmaciones de los últimos siete días."
        actions={
          <button
            type="button"
            className="button"
            disabled={busy || !pending || !online}
            onClick={() => void synchronize()}
          >
            <RefreshCw size={17} />
            {busy ? "Sincronizando…" : "Sincronizar ahora"}
          </button>
        }
      />
      <p className="notice" role="status">
        {background === undefined
          ? "Comprobando sincronización en segundo plano…"
          : background
            ? "La sincronización automática está activa. Los pendientes se enviarán cuando vuelva la conexión y la sesión siga vigente."
            : "La sincronización automática no está disponible en este navegador. Abrí la aplicación con conexión para enviar los pendientes."}
      </p>
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState description={error} onRetry={retry} />
      ) : (
        <>
          {data?.rows.length ? (
          <div className="grid">
            {data.rows.map((row) => (
              <article className="card" key={row.id}>
                <div className="section-title">
                  <div>
                    <h2>{row.payload.tipoTrabajo.replaceAll("_", " ")}</h2>
                    <p>{row.payload.descripcion}</p>
                  </div>
                  <button
                    type="button"
                    className="button button--danger"
                    disabled={busy || (row.leaseUntil ?? 0) > clockNow}
                      onClick={async () => {
                        const confirmed = await confirm({
                          title: row.status === "synced" ? "Ocultar confirmación" : "Descartar operación pendiente",
                          message:
                            row.status === "synced"
                              ? "La confirmación se ocultará de esta lista. La refacción registrada en el servidor no se eliminará."
                              : "El registro se quitará de la cola local. Si ya intentaste enviarlo, revisá primero el taller para evitar perder una operación pendiente o duplicarla después.",
                          confirmLabel: row.status === "synced" ? "Continuar" : "Continuar con el descarte",
                          secondConfirmLabel: row.status === "synced" ? "Sí, ocultar" : "Sí, descartar operación",
                        });
                        if (!confirmed) return;
                        try {
                          await syncQueue.remove(row.id, username, API_URL);
                          retry();
                        } catch (cause) {
                          show(errorMessage(cause, "No pudimos descartar esta operación."), "error");
                        }
                      }}
                    >
                    <Trash2 size={17} />
                    {row.status === "synced" ? "Ocultar" : "Descartar"}
                  </button>
                </div>
                <span className="queue-status" role="status">
                    {row.status === "syncing" &&
                    (row.leaseUntil ?? 0) <= clockNow
                      ? "Envío interrumpido: pendiente de reintento"
                      : statusLabels[row.status ?? "pending"]}
                  </span>
                <div className="detail-list">
                  <div className="detail-item">
                    <small>Vehículo</small>
                    <Link to={`/app/vehiculos/${row.payload.vehiculoId}`}>
                        #{row.payload.vehiculoId}
                    </Link>
                  </div>
                  <div className="detail-item">
                      <small>Fecha</small>
                      <strong>{formatDate(row.payload.fecha)}</strong>
                    </div>
                  <div className="detail-item">
                    <small>Intentos</small>
                    <strong>{row.attempts}</strong>
                  </div>
                </div>
                {row.lastError && (
                  <p className="notice notice--warning">{row.lastError}</p>
                )}
                {row.serverId && (
                    <Link
                      className="button button--secondary"
                      to={`/app/taller/${row.serverId}?vehiculoId=${row.payload.vehiculoId}`}
                    >
                      Abrir refacción confirmada
                    </Link>
                  )}
              </article>
            ))}
          </div>
        ) : (
         <div className="state-card">
              <strong>
                No hay operaciones de tu cuenta en este dispositivo
              </strong>
            </div>
          )}
          {Boolean(data?.legacy.length) && (
            <section className="card">
              <h2>Registros de la versión anterior</h2>
              <p>
                Estos registros no tienen autor identificado y no se enviarán
                automáticamente. Asociá únicamente los que reconozcas como
                tuyos.
              </p>
              {data?.legacy.map((row) => (
                <article key={row.id} className="timeline-row">
                  <div>
                    <strong>
                      Vehículo #{row.payload.vehiculoId} ·{" "}
                      {formatDate(row.payload.fecha)}
                    </strong>
                    <p>{row.payload.descripcion}</p>
                    <button
                      className="button button--secondary"
                      type="button"
                      onClick={async () => {
                        const confirmed = await confirm({
                          title: "Asociar registro heredado",
                          message: "El registro se asociará a tu cuenta y quedará habilitado para su envío al servidor. Verificá que realmente te pertenezca y corresponda a esta automotora.",
                          confirmLabel: "Continuar con la asociación",
                          secondConfirmLabel: "Sí, asociar a mi cuenta",
                          destructive: false,
                        });
                        if (!confirmed) return;
                        try {
                          await syncQueue.adoptLegacy(
                            row.id,
                            username,
                            API_URL,
                          );
                          await requestBackgroundSync();
                          retry();
                        } catch (cause) {
                          show(errorMessage(cause, "No pudimos asociar este registro a tu cuenta."), "error");
                        }
                      }}
                    >
                      Asociar a mi cuenta
                    </button>
                  </div>
                </article>
              ))}
            </section>
          )}
        </>
      )}
    </>
  );
}
