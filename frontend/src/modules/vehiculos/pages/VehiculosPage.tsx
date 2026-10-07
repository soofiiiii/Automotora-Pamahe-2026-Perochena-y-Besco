import { Eye, Pencil, Plus } from "lucide-react";
import { useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PAGE_SIZE } from "../../../config/appConfig";
import { COMMERCIAL_ROLES, hasAnyRole } from "../../../config/permissions";
import { useAuth } from "../../../hooks/useAuth";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { vehiculoService } from "../../../services/api";
import { EmptyState } from "../../../shared/feedback/EmptyState";
import { ErrorState } from "../../../shared/feedback/ErrorState";
import { LoadingState } from "../../../shared/feedback/LoadingState";
import { VehicleFiltersForm } from "../../../shared/filters/VehicleFiltersForm";
import { PaginationControls } from "../../../shared/navigation/PaginationControls";
import { DataTable, type Column } from "../../../shared/tables/DataTable";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { StatusBadge } from "../../../shared/ui/StatusBadge";
import {
  hasCommercialData,
  type Vehiculo,
} from "../../../types/vehiculo.types";
import { formatCurrency } from "../../../utils/formatCurrency";
import { parseVehicleFilters } from "../../../utils/vehicleFilters";

const readPage = (value: string | null) => {
  const parsed = Number(value ?? "1");
  return Number.isInteger(parsed) && parsed > 0 ? parsed - 1 : 0;
};

export default function VehiculosPage() {
  const { session } = useAuth();
  const commercial = hasAnyRole(session?.roles ?? [], COMMERCIAL_ROLES);
  const [params, setParams] = useSearchParams();
  const query = params.toString();
  const page = readPage(params.get("page"));

  const load = useCallback(
    async (signal: AbortSignal) =>
      vehiculoService.page(
        {
          ...parseVehicleFilters(new URLSearchParams(query), true, commercial),
          page,
          size: PAGE_SIZE,
          sort: "id,desc",
        },
        signal,
      ),
    [query, commercial, page],
  );

  const { data, loading, error, retry } = useApiQuery(load);
  const rows = data?.content ?? [];

  const setPage = (nextPage: number) => {
    const next = new URLSearchParams(params);
    if (nextPage <= 0) next.delete("page");
    else next.set("page", String(nextPage + 1));
    setParams(next, { replace: true });
  };

  const columns: Column<Vehiculo>[] = [
    {
      key: "vehicle",
      header: "Vehículo",
      cell: (vehicle) => (
        <>
          <strong>
            {vehicle.marca} {vehicle.modelo}
          </strong>
          <small className="muted display-block">
            {vehicle.anio} · {vehicle.matricula || "Sin matrícula"} ·{" "}
            {vehicle.tipoVehiculoLabel ?? vehicle.tipoVehiculo ?? "Sin especificar"}
          </small>
        </>
      ),
    },
    {
      key: "state",
      header: "Estado operativo",
      cell: (vehicle) => <StatusBadge value={vehicle.estado} />,
    },
    {
      key: "availability",
      header: "Disponibilidad comercial",
      cell: (vehicle) =>
        vehicle.activo && vehicle.estado === "DISPONIBLE"
          ? "Disponible para venta"
          : "No disponible para venta",
    },
    {
      key: "km",
      header: "Kilometraje",
      cell: (vehicle) =>
        vehicle.kilometraje == null
          ? "Sin registrar"
          : `${Intl.NumberFormat("es-UY").format(vehicle.kilometraje)} km`,
    },
    ...(commercial
      ? [
          {
            key: "price",
            header: "Precio estimado",
            cell: (vehicle: Vehiculo) =>
              hasCommercialData(vehicle)
                ? vehicle.precioVentaEstimado == null
                  ? "Sin precio"
                  : formatCurrency(vehicle.precioVentaEstimado)
                : "No disponible para este perfil",
          },
          {
            key: "publication",
            header: "Catálogo",
            cell: (vehicle: Vehiculo) =>
              hasCommercialData(vehicle) ? (
                <StatusBadge
                  value={vehicle.publicado ? "Publicado" : "No publicado"}
                />
              ) : (
                "No disponible para este perfil"
              ),
          },
        ]
      : []),
    {
      key: "actions",
      header: "Acciones",
      cell: (vehicle) => (
        <div className="actions-row">
          <Link
            className="button button--secondary"
            to={`/app/vehiculos/${vehicle.id}`}
          >
            <Eye size={16} aria-hidden="true" />
            Ver
          </Link>
          {commercial && vehicle.activo && (
            <Link
              className="button button--secondary"
              to={`/app/vehiculos/${vehicle.id}/editar`}
            >
              <Pencil size={16} aria-hidden="true" />
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
              <Plus size={17} aria-hidden="true" />
              Nuevo vehículo
            </Link>
          ) : undefined
        }
      />
      <VehicleFiltersForm
        key={`${query}-${commercial}`}
        params={params}
        internal
        commercial={commercial}
        onApply={(next) => setParams(next, { replace: true })}
      />
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState description={error} onRetry={retry} />
      ) : rows.length ? (
        <>
          <DataTable
            rows={rows}
            columns={columns}
            keyOf={(row) => row.id}
            caption={`${data?.totalElements ?? rows.length} vehículos encontrados`}
          />
          {data?.serverPaged && (
            <PaginationControls
              page={data.number}
              totalPages={data.totalPages}
              totalElements={data.totalElements}
              onPageChange={setPage}
            />
          )}
        </>
      ) : (
        <EmptyState title="No hay vehículos con esos filtros" />
      )}
    </>
  );
}
