import { useCallback, useState } from "react";
import { PAGE_SIZE } from "../../../config/appConfig";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { auditoriaService, type AuditoriaFilters } from "../../../services/api";
import { EmptyState } from "../../../shared/feedback/EmptyState";
import { ErrorState } from "../../../shared/feedback/ErrorState";
import { LoadingState } from "../../../shared/feedback/LoadingState";
import { PaginationControls } from "../../../shared/navigation/PaginationControls";
import { DataTable, type Column } from "../../../shared/tables/DataTable";
import { PageHeader } from "../../../shared/ui/PageHeader";
import type { Auditoria } from "../../../types/domain.types";

const DATE_RANGE_ERROR =
  'La fecha "Desde" no puede ser posterior a la fecha "Hasta".';

export default function AuditoriaPage() {
  const [user, setUser] = useState("");
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const [entityId, setEntityId] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [dateRangeError, setDateRangeError] = useState("");
  const [filters, setFilters] = useState<AuditoriaFilters>({});
  const [page, setPage] = useState(0);

  const load = useCallback(
    (signal: AbortSignal) =>
      auditoriaService.page(
        {
          ...filters,
          page,
          size: PAGE_SIZE,
        },
        signal,
      ),
    [filters, page],
  );

  const { data, loading, error, retry } = useApiQuery(load);
  const rows = data?.content ?? [];

  const handleSearch = () => {
    if (desde && hasta && desde > hasta) {
      setDateRangeError(DATE_RANGE_ERROR);
      return;
    }

    const next: AuditoriaFilters = {};
    if (user.trim()) next.usuario = user.trim();
    if (action.trim()) next.accion = action.trim();
    if (entity.trim()) next.entidad = entity.trim();
    if (entityId.trim()) {
      const parsedId = Number(entityId);
      if (Number.isSafeInteger(parsedId) && parsedId > 0) {
        next.entidadId = parsedId;
      }
    }
    if (desde) next.desde = desde;
    if (hasta) next.hasta = hasta;

    setDateRangeError("");
    setPage(0);
    setFilters(next);
  };

  const handleClear = () => {
    setUser("");
    setAction("");
    setEntity("");
    setEntityId("");
    setDesde("");
    setHasta("");
    setDateRangeError("");
    setPage(0);
    setFilters({});
  };

  const cols: Column<Auditoria>[] = [
    {
      key: "date",
      header: "Fecha",
      cell: (row) => String(row.creadoEn ?? "—").replace("T", " "),
    },
    { key: "user", header: "Usuario", cell: (row) => row.usuario },
    { key: "action", header: "Acción", cell: (row) => row.accion },
    {
      key: "entity",
      header: "Entidad",
      cell: (row) => `${row.entidad} ${row.entidadId ?? ""}`.trim(),
    },
    { key: "detail", header: "Detalle", cell: (row) => row.detalle ?? "—" },
  ];

  return (
    <>
      <PageHeader
        title="Auditoría"
        description="Consulta de acciones críticas con filtros aplicados directamente sobre el registro del sistema."
      />

      <form
        className="toolbar"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          handleSearch();
        }}
      >
        <label className="field">
          <span>Usuario</span>
          <input value={user} onChange={(event) => setUser(event.target.value)} />
        </label>
        <label className="field">
          <span>Acción</span>
          <input
            value={action}
            onChange={(event) => setAction(event.target.value)}
          />
        </label>
        <label className="field">
          <span>Entidad</span>
          <input
            value={entity}
            onChange={(event) => setEntity(event.target.value)}
          />
        </label>
        <label className="field">
          <span>ID de entidad</span>
          <input
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={entityId}
            onChange={(event) => setEntityId(event.target.value)}
          />
        </label>
        <label className="field">
          <span>Desde</span>
          <input
            type="date"
            value={desde}
            aria-invalid={Boolean(dateRangeError)}
            aria-describedby={
              dateRangeError ? "auditoria-date-range-error" : undefined
            }
            onChange={(event) => {
              setDesde(event.target.value);
              if (dateRangeError) setDateRangeError("");
            }}
          />
        </label>
        <label className="field">
          <span>Hasta</span>
          <input
            type="date"
            value={hasta}
            aria-invalid={Boolean(dateRangeError)}
            aria-describedby={
              dateRangeError ? "auditoria-date-range-error" : undefined
            }
            onChange={(event) => {
              setHasta(event.target.value);
              if (dateRangeError) setDateRangeError("");
            }}
          />
          {dateRangeError && (
            <span
              id="auditoria-date-range-error"
              className="field__error"
              role="alert"
            >
              {dateRangeError}
            </span>
          )}
        </label>
        <button type="submit" className="button" disabled={loading}>
          Buscar
        </button>
        <button
          type="button"
          className="button button--secondary"
          onClick={handleClear}
          disabled={loading}
        >
          Limpiar
        </button>
      </form>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState description={error} onRetry={retry} />
      ) : rows.length ? (
        <>
          <DataTable
            rows={rows}
            columns={cols}
            keyOf={(row) => row.id}
            caption={`${data?.totalElements ?? rows.length} registros de auditoría`}
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
        <EmptyState title="No hay registros con esos filtros" />
      )}
    </>
  );
}
