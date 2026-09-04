import { useEffect, useMemo, useState } from "react";
import { auditoriaService } from "../../../services/api";
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

  useEffect(() => {
    auditoriaService
      .list()
      .then(setRows)
      .catch((e) => show(errorMessage(e), "error"))
      .finally(() => setLoading(false));
  }, [show]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (!user || r.usuario.toLowerCase().includes(user.toLowerCase())) &&
          (!action || r.accion.toLowerCase().includes(action.toLowerCase())) &&
          (!entity || r.entidad.toLowerCase().includes(entity.toLowerCase())) &&
          (!date || (r.creadoEn ?? "").startsWith(date)),
      ),
    [rows, user, action, entity, date],
  );

  const cols: Column<Auditoria>[] = [
    {
      key: "date",
      header: "Fecha",
      cell: (r) => String(r.creadoEn ?? "—").replace("T", " "),
    },
    { key: "user", header: "Usuario", cell: (r) => r.usuario },
    { key: "action", header: "Acción", cell: (r) => r.accion },
    {
      key: "entity",
      header: "Entidad",
      cell: (r) => `${r.entidad} ${r.entidadId ?? ""}`,
    },
    { key: "detail", header: "Detalle", cell: (r) => r.detalle ?? "—" },
  ];

  return (
    <>
      {/*Cuando se agreguen los filtros desde la API hay que actualizarlos desde la vista, para que se manden en las peticiones*/}
      <PageHeader
        title="Auditoría"
        description="Consulta de acciones críticas."
      />
      <div className="toolbar">
        <label className="field">
          <span>Usuario</span>
          <input value={user} onChange={(e) => setUser(e.target.value)} />
        </label>
        <label className="field">
          <span>Acción</span>
          <input value={action} onChange={(e) => setAction(e.target.value)} />
        </label>
        <label className="field">
          <span>Entidad</span>
          <input value={entity} onChange={(e) => setEntity(e.target.value)} />
        </label>
        <label className="field">
          <span>Fecha</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
      </div>
      {loading ? (
        <LoadingState />
      ) : filtered.length ? (
        <DataTable rows={filtered} columns={cols} keyOf={(r) => r.id} />
      ) : (
        <EmptyState title="No hay registros con esos filtros" />
      )}
    </>
  );
}
