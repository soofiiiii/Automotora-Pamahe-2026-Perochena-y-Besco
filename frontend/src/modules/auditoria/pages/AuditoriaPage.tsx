import { useEffect, useState } from "react";
import { auditoriaService, type AuditoriaFilters } from "../../../services/api";
import type { Auditoria } from "../../../types/domain.types";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { LoadingState } from "../../../shared/feedback/LoadingState";
import { EmptyState } from "../../../shared/feedback/EmptyState";
import { DataTable, type Column } from "../../../shared/tables/DataTable";
import { useToast } from "../../../shared/feedback/useToast";
import { errorMessage } from "../../../utils/errorMessage";

export default function AuditoriaPage() {
  const [rows, setRows] = useState<Auditoria[]>([]);
  const [user, setUser] = useState("");
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const { show } = useToast();
  const loadAuditoria = (filters?: AuditoriaFilters) => {
    setLoading(true);

    auditoriaService
      .list(filters)
      .then(setRows)
      .catch((e) => show(errorMessage(e), "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAuditoria();
  }, []);

  const handleSearch = () => {
    const filters: AuditoriaFilters = {};
    if (user.trim()) {
      filters.usuario = user.trim();
    }
    if (action.trim()) {
      filters.accion = action.trim();
    }
    if (entity.trim()) {
      filters.entidad = entity.trim();
    }
    if (date) {
      filters.desde = date;
      filters.hasta = date;
    }
    loadAuditoria(filters);
  };

  const handleClear = () => {
    setUser("");
    setAction("");
    setEntity("");
    setDate("");
    loadAuditoria();
  };

  const cols: Column<Auditoria>[] = [
    {
      key: "date",
      header: "Fecha",
      cell: (r) => String(r.creadoEn ?? "—").replace("T", " "),
    },

    {
      key: "user",
      header: "Usuario",
      cell: (r) => r.usuario,
    },

    {
      key: "action",
      header: "Acción",
      cell: (r) => r.accion,
    },

    {
      key: "entity",
      header: "Entidad",
      cell: (r) => `${r.entidad} ${r.entidadId ?? ""}`,
    },

    {
      key: "detail",
      header: "Detalle",
      cell: (r) => r.detalle ?? "—",
    },
  ];

  return (
    <>
      <PageHeader
        title="Auditoría"
        description="Consulta de acciones críticas."
      />
      <div className="toolbar">
        <label className="field">
          <span>Usuario</span>
          <input
            value={user}
            onChange={(e) => setUser(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Acción</span>
          <input
            value={action}
            onChange={(e) => setAction(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Entidad</span>
          <input
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Fecha</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="button"
          onClick={handleSearch}
          disabled={loading}
        >
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
      </div>

      {loading ? (
        <LoadingState />
      ) : rows.length ? (
        <DataTable
          rows={rows}
          columns={cols}
          keyOf={(r) => r.id}
        />
      ) : (
        <EmptyState title="No hay registros con esos filtros" />
      )}
    </>
  );
}