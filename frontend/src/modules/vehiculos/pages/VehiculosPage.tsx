import { Eye, Pencil, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { COMMERCIAL_ROLES, hasAnyRole } from "../../../config/permissions";
import { useAuth } from "../../../hooks/useAuth";
import { vehiculoService } from "../../../services/api";
import type { EstadoVehiculo, Vehiculo } from "../../../types/vehiculo.types";
import { LoadingState } from "../../../shared/feedback/LoadingState";
import { EmptyState } from "../../../shared/feedback/EmptyState";
import { DataTable, type Column } from "../../../shared/tables/DataTable";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { StatusBadge } from "../../../shared/ui/StatusBadge";
import { formatCurrency } from "../../../utils/formatCurrency";
import { useToast } from "../../../shared/feedback/useToast";
import { errorMessage } from "../../../utils/errorMessage";

const states: EstadoVehiculo[] = [
  "COMPRADO",
  "EN_TALLER",
  "DISPONIBLE",
  "RESERVADO",
  "VENDIDO",
  "DADO_DE_BAJA",
];

export default function VehiculosPage() {
  const { session } = useAuth();
  const commercial = hasAnyRole(session?.roles ?? [], COMMERCIAL_ROLES);
  const [rows, setRows] = useState<Vehiculo[]>([]);
  const [q, setQ] = useState("");
  const [state, setState] = useState("");
  const [year, setYear] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const { show } = useToast();

  useEffect(() => {
    vehiculoService
      .list()
      .then(setRows)
      .catch((e) => show(errorMessage(e), "error"))
      .finally(() => setLoading(false));
  }, [show]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (v) =>
          (!state || v.estado === state) &&
          (!year || v.anio === Number(year)) &&
          (!maxPrice || (v.precioVentaEstimado ?? 0) <= Number(maxPrice)) &&
          `${v.marca} ${v.modelo} ${v.matricula} ${v.anio}`
            .toLowerCase()
            .includes(q.toLowerCase()),
      ),
    [rows, q, state, year, maxPrice],
  );

  const cols: Column<Vehiculo>[] = [
    {
      key: "vehicle",
      header: "Vehículo",
      cell: (v) => (
        <>
          <strong>
            {v.marca} {v.modelo}
          </strong>
          <small className="muted" style={{ display: "block" }}>
            {v.anio} · {v.matricula}
          </small>
        </>
      ),
    },
    {
      key: "state",
      header: "Estado",
      cell: (v) => <StatusBadge value={v.estado} />,
    },
    {
      key: "km",
      header: "Kilometraje",
      cell: (v) =>
        v.kilometraje
          ? `${Intl.NumberFormat("es-UY").format(v.kilometraje)} km`
          : "—",
    },
    {
      key: "price",
      header: "Precio publicado",
      cell: (v) =>
        commercial ? formatCurrency(v.precioVentaEstimado) : "Restringido",
    },
    {
      key: "published",
      header: "Catálogo",
      cell: (v) => (
        <StatusBadge value={v.publicado ? "Publicado" : "No publicado"} />
      ),
    },
    {
      key: "a",
      header: "Acciones",
      cell: (v) => (
        <div className="actions-row">
          <Link
            className="button button--secondary"
            to={`/app/vehiculos/${v.id}`}
          >
            <Eye size={16} />
            Ver
          </Link>
          {commercial && v.activo && (
            <Link
              className="button button--secondary"
              to={`/app/vehiculos/${v.id}/editar`}
            >
              <Pencil size={16} />
              Editar
            </Link>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Vehículos"
        description="Inventario central con estados operativos y disponibilidad comercial."
        actions={
          commercial ? (
            <Link className="button" to="/app/vehiculos/nuevo">
              <Plus size={17} />
              Nuevo vehículo
            </Link>
          ) : undefined
        }
      />
      <div className="toolbar">
        <label className="field">
          <span>Buscar</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Marca, modelo o matrícula"
          />
        </label>
        <label className="field">
          <span>Estado</span>
          <select value={state} onChange={(e) => setState(e.target.value)}>
            <option value="">Todos</option>
            {states.map((s) => (
              <option value={s} key={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Año</span>
          <input
            type="number"
            min="1900"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="Todos"
          />
        </label>
        {commercial && (
          <label className="field">
            <span>Precio máximo</span>
            <input
              type="number"
              min="0"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Sin límite"
            />
          </label>
        )}
      </div>
      {loading ? (
        <LoadingState />
      ) : filtered.length ? (
        <DataTable rows={filtered} columns={cols} keyOf={(r) => r.id} />
      ) : (
        <EmptyState title="No hay vehículos para mostrar" />
      )}
    </>
  );
}
