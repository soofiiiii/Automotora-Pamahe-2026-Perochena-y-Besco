import { Cloud, Plus, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { tallerService } from "../../../services/api";
import type { EstadoRefaccion } from "../../../types/domain.types";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { QUEUE_CHANGED_EVENT } from "../../../offline/backgroundSync";
import { LoadingState } from "../../../shared/feedback/LoadingState";
import { EmptyState } from "../../../shared/feedback/EmptyState";
import { ErrorState } from "../../../shared/feedback/ErrorState";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { StatusBadge } from "../../../shared/ui/StatusBadge";
import { formatCurrency } from "../../../utils/formatCurrency";
import { formatDate } from "../../../utils/formatDate";

const states: Array<EstadoRefaccion | ""> = [
  "",
  "PENDIENTE",
  "EN_CURSO",
  "FINALIZADA",
  "CANCELADA",
];

export default function TallerPage() {
  const [state, setState] = useState("");
  const load = useCallback(
    (signal: AbortSignal) => tallerService.list(state || undefined, signal),
    [state],
  );
  const { data: rows = [], loading, error, retry } = useApiQuery(load);
  useEffect(() => {
    window.addEventListener(QUEUE_CHANGED_EVENT, retry);
    return () => window.removeEventListener(QUEUE_CHANGED_EVENT, retry);
  }, [retry]);

  return (
    <>
      <PageHeader
        title="Taller"
        description="Trabajos de reacondicionamiento, responsables y evidencia registrada."
        actions={
          <>
            <Link className="button button--secondary" to="/app/taller/offline">
              <Cloud size={17} />
              Operaciones pendientes
            </Link>
            <Link className="button button--accent" to="/app/taller/nueva">
              <Plus size={18} />
              Nueva refacción
            </Link>
          </>
        }
      />
      <div className="toolbar">
        <label className="field">
          <span>Estado de tarea</span>
          <select
            value={state}
            onChange={(event) => setState(event.target.value)}
          >
            {states.map((value) => (
              <option key={value || "all"} value={value}>
                {value ? value.replaceAll("_", " ") : "Todas"}
              </option>
            ))}
          </select>
        </label>
        <button
          className="button button--secondary"
          type="button"
          disabled={loading}
          onClick={retry}
        >
          <RefreshCw size={17} />
          Actualizar
        </button>
      </div>
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState description={error} onRetry={retry} />
      ) : rows.length ? (
        <div className="workshop-grid">
          {rows.map((repair) => (
            <article className="work-card" key={repair.id}>
              <div className="work-card__top">
                <StatusBadge value={repair.estadoTarea} />
                <span>{formatDate(repair.fecha)}</span>
              </div>
              <h2>{repair.tipoTrabajo.replaceAll("_", " ")}</h2>
              <p>{repair.descripcion}</p>
              <div className="work-card__meta">
                <span>
                  Vehículo <b>{repair.vehiculo || `#${repair.vehiculoId}`}</b>
                </span>
                <span>
                  Responsable{" "}
                  <b>{repair.responsableOperativo || "Sin asignar"}</b>
                </span>
                <span>
                  Registrado por{" "}
                  <b>{repair.usuarioQueRegistra || "No informado"}</b>
                </span>
                <span>
                  Evidencia{" "}
                  <b>
                    {repair.registroFotograficoUrl
                      ? "Referencia disponible"
                      : "Sin referencia"}
                  </b>
                </span>
                <span>
                  Repuestos <b>{formatCurrency(repair.costoRepuestos)}</b>
                </span>
                <span>
                  Mano de obra <b>{formatCurrency(repair.costoManoObra)}</b>
                </span>
                <span>
                  Servicios{" "}
                  <b>{formatCurrency(repair.costoServiciosExternos)}</b>
                </span>
                <span>
                  Total <b>{formatCurrency(repair.costoTotal)}</b>
                </span>
              </div>
              <div className="actions-row">
                <Link
                  className="button button--secondary"
                  to={`/app/taller/${repair.id}?vehiculoId=${repair.vehiculoId}`}
                >
                  Abrir tarea
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No hay tareas con este estado" />
      )}
    </>
  );
}
