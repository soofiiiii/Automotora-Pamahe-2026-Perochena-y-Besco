import { Pencil, Plus, UserX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { clienteService } from "../../../services/api";
import type { Cliente } from "../../../types/domain.types";
import { DataTable, type Column } from "../../../shared/tables/DataTable";
import { LoadingState } from "../../../shared/feedback/LoadingState";
import { EmptyState } from "../../../shared/feedback/EmptyState";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { StatusBadge } from "../../../shared/ui/StatusBadge";
import { useToast } from "../../../shared/feedback/useToast";
import { errorMessage } from "../../../utils/errorMessage";

export default function ClientesPage() {
  const [rows, setRows] = useState<Cliente[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { show } = useToast();

  const load = () => {
    setLoading(true);

    clienteService
      .list()
      .then(setRows)
      .catch((e) => show(errorMessage(e), "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;

    clienteService
      .list()
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
  }, [show]);

  const filtered = useMemo(
    () =>
      rows.filter((c) =>
        `${c.nombre} ${c.apellido ?? ""} ${c.razonSocial ?? ""} ${c.documento}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [rows, query],
  );
  
  const cols: Column<Cliente>[] = [
    {
      key: "name",
      header: "Cliente",
      cell: (r) => (
        <strong>{r.razonSocial || `${r.nombre} ${r.apellido ?? ""}`}</strong>
      ),
    },
    { key: "doc", header: "Documento", cell: (r) => r.documento },
    {
      key: "contact",
      header: "Contacto",
      cell: (r) => (
        <>
          {r.telefono}
          <small className="muted" style={{ display: "block" }}>
            {r.email}
          </small>
        </>
      ),
    },
    {
      key: "type",
      header: "Tipo",
      cell: (r) => <StatusBadge value={r.tipoCliente} />,
    },
    {
      key: "state",
      header: "Estado",
      cell: (r) => <StatusBadge value={r.activo} />,
    },
    {
      key: "a",
      header: "Acciones",
      cell: (r) => (
        <div className="actions-row">
          <Link
            className="button button--secondary"
            to={`/app/clientes/${r.id}/editar`}
          >
            <Pencil size={16} />
            Editar
          </Link>
          {r.activo && (
            <button
              className="button button--danger"
              onClick={async () => {
                if (!confirm("¿Desactivar este cliente?")) return;
                try {
                  await clienteService.deactivate(r.id);
                  show("Cliente desactivado.", "success");
                  load();
                } catch (e) {
                  show(errorMessage(e), "error");
                }
              }}
            >
              <UserX size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];
  return (
    <>
      <PageHeader
        title="Clientes"
        description="Compradores, vendedores y personas que cumplen ambos roles comerciales."
        actions={
          <Link className="button" to="/app/clientes/nuevo">
            <Plus size={17} />
            Nuevo cliente
          </Link>
        }
      />
      <div className="toolbar">
        <label className="field">
          <span>Buscar</span>
          <input
            placeholder="Nombre o documento"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      {loading ? (
        <LoadingState />
      ) : filtered.length ? (
        <DataTable rows={filtered} columns={cols} keyOf={(r) => r.id} />
      ) : (
        <EmptyState title="Sin resultados" />
      )}
    </>
  );
}
