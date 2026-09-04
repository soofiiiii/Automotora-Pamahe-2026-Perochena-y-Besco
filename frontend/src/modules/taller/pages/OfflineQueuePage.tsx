import { RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { tallerOfflineService } from "../../../offline/tallerOfflineService";
import { syncQueue } from "../../../offline/syncQueue";
import type { PendingRepair } from "../../../offline/indexedDb";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { StatusBadge } from "../../../shared/ui/StatusBadge";
import { useToast } from "../../../shared/feedback/useToast";

export default function OfflineQueuePage() {
  const [rows, setRows] = useState<PendingRepair[]>([]);
  const [busy, setBusy] = useState(false);
  const { show } = useToast();
  const load = () => syncQueue.list().then(setRows);

  useEffect(() => {
    void load();
  }, []);

  const sync = async () => {
    setBusy(true);
    const r = await tallerOfflineService.sync();
    await load();
    setBusy(false);
    if (r.synced) show(`${r.synced} registro(s) sincronizado(s).`, "success");
    if (r.failed) show(`${r.failed} registro(s) siguen pendientes.`, "error");
  };
  
  return (
    <>
      <PageHeader
        title="Cola offline"
        description="Registros creados sin conexión y todavía no confirmados por la API."
        actions={
          <button
            className="button"
            disabled={busy || !rows.length || !navigator.onLine}
            onClick={sync}
          >
            <RefreshCw size={17} />
            {busy ? "Sincronizando…" : "Sincronizar ahora"}
          </button>
        }
      />
      {rows.length ? (
        <div className="grid">
          {rows.map((r) => (
            <article className="card" key={r.id}>
              <div className="section-title">
                <div>
                  <StatusBadge value={r.payload.estadoTarea} />
                  <h2 style={{ marginTop: 10 }}>{r.payload.tipoTrabajo}</h2>
                  <p>{r.payload.descripcion}</p>
                </div>
                <button
                  className="button button--danger"
                  onClick={async () => {
                    if (confirm("¿Descartar este registro local?")) {
                      await syncQueue.remove(r.id);
                      load();
                    }
                  }}
                >
                  <Trash2 size={17} />
                  Descartar
                </button>
              </div>
              <div className="detail-list">
                <div className="detail-item">
                  <small>Vehículo</small>
                  <strong>#{r.payload.vehiculoId}</strong>
                </div>
                <div className="detail-item">
                  <small>Intentos</small>
                  <strong>{r.attempts}</strong>
                </div>
              </div>
              {r.lastError && (
                <p className="notice notice--warning" style={{ marginTop: 12 }}>
                  {r.lastError}
                </p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="state-card">
          <strong>No hay registros pendientes</strong>
          <p>La cola local está sincronizada.</p>
        </div>
      )}
    </>
  );
}
