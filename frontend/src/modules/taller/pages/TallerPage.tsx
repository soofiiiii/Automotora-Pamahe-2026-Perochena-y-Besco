import { Cloud, Plus, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { tallerService } from "../../../services/api";
import type { EstadoRefaccion, Refaccion } from "../../../types/domain.types";
import { LoadingState } from "../../../shared/feedback/LoadingState";
import { EmptyState } from "../../../shared/feedback/EmptyState";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { StatusBadge } from "../../../shared/ui/StatusBadge";
import { useToast } from "../../../shared/feedback/useToast";
import { formatCurrency } from "../../../utils/formatCurrency";
import { formatDate } from "../../../utils/formatDate";
import { errorMessage } from "../../../utils/errorMessage";

const states: Array<EstadoRefaccion | ""> = [
  "",
  "PENDIENTE",
  "EN_CURSO",
  "FINALIZADA",
  "CANCELADA",
];

export default function TallerPage() {
  const [rows, setRows] = useState<Refaccion[]>([]);
  const [state, setState] = useState("");
  const [loading, setLoading] = useState(true);
  const { show } = useToast();

  const load = () => {
    setLoading(true);
    tallerService
      .list(state || undefined)
      .then(setRows)
      .catch((e) => show(errorMessage(e), "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;

    tallerService
      .list(state || undefined)
      .then((data) => {
        if (!cancelled) {
          setRows(data);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          show(errorMessage(error), "error");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [state, show]);

  return (
    <>
      <PageHeader
        title="Taller"
        description="Vista touch-first para registrar y seguir los trabajos de reacondicionamiento."
        actions={
          <>
            <Link className="button button--secondary" to="/app/taller/offline">
              <Cloud size={17} />
              Cola offline
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
            onChange={(e) => {
              setLoading(true);
              setState(e.target.value);
            }}
          >
            {states.map((s) => (
              <option key={s || "all"} value={s}>
                {s ? s.replaceAll("_", " ") : "Todas"}
              </option>
            ))}
          </select>
        </label>
        <button
          className="button button--secondary"
          type="button"
          onClick={load}
        >
          <RefreshCw size={17} />
          Actualizar
        </button>
      </div>
      {loading ? (
        <LoadingState />
      ) : rows.length ? (
        <div className="workshop-grid">
          {rows.map((r) => (
            <article className="work-card" key={r.id}>
              <div className="work-card__top">
                <StatusBadge value={r.estadoTarea} />
                <span>{formatDate(r.fecha)}</span>
              </div>
              <h2>{r.tipoTrabajo.replaceAll("_", " ")}</h2>
              <p>{r.descripcion}</p>
              <div className="work-card__meta">
                <span>
                  Vehículo <b>{r.vehiculo || `#${r.vehiculoId}`}</b>
                </span>
                <span>
                  Repuestos <b>{formatCurrency(r.costoRepuestos)}</b>
                </span>
                <span>
                  Mano de obra <b>{formatCurrency(r.costoManoObra)}</b>
                </span>
                <span>
                  Servicios <b>{formatCurrency(r.costoServiciosExternos)}</b>
                </span>
                <span>
                  Total <b>{formatCurrency(r.costoTotal)}</b>
                </span>
              </div>
              <Link
                className="button button--secondary"
                to={`/app/taller/${r.id}/editar`}
              >
                Abrir tarea
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No hay tareas con este estado" />
      )}
    </>
  );
}
