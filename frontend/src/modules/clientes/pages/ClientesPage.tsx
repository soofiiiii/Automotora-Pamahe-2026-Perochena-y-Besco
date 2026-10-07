import { Pencil, Plus, Search, UserX, X } from "lucide-react";
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { PAGE_SIZE } from "../../../config/appConfig";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { clienteService } from "../../../services/api";
import { DataTable, type Column } from "../../../shared/tables/DataTable";
import { EmptyState } from "../../../shared/feedback/EmptyState";
import { ErrorState } from "../../../shared/feedback/ErrorState";
import { LoadingState } from "../../../shared/feedback/LoadingState";
import { PaginationControls } from "../../../shared/navigation/PaginationControls";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { StatusBadge } from "../../../shared/ui/StatusBadge";
import { useToast } from "../../../shared/feedback/useToast";
import { useConfirmDialog } from "../../../shared/feedback/useConfirmDialog";
import type { Cliente } from "../../../types/domain.types";
import { errorMessage } from "../../../utils/errorMessage";

const MAX_QUERY_LENGTH = 120;

export default function ClientesPage() {
  const [queryDraft, setQueryDraft] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const { show } = useToast();
  const { confirm } = useConfirmDialog();

  const load = useCallback(
    (signal: AbortSignal) =>
      clienteService.page(
        {
          ...(query ? { q: query } : {}),
          page,
          size: PAGE_SIZE,
        },
        signal,
      ),
    [page, query],
  );

  const { data, loading, error, retry } = useApiQuery(load);
  const rows = data?.content ?? [];

  const applySearch = () => {
    setQuery(queryDraft.trim());
    setPage(0);
  };

  const clearSearch = () => {
    setQueryDraft("");
    setQuery("");
    setPage(0);
  };

  const deactivate = async (id: number) => {
    const confirmed = await confirm({
      title: "Desactivar cliente",
      message: "El cliente dejará de estar disponible para nuevas compras o ventas. Su historial comercial se conservará.",
      confirmLabel: "Continuar con la desactivación",
      secondConfirmLabel: "Sí, desactivar cliente",
    });
    if (!confirmed) return;

    try {
      await clienteService.deactivate(id);
      show("Cliente desactivado correctamente.", "success");
      retry();
    } catch (error) {
      show(errorMessage(error, "No pudimos desactivar el cliente."), "error");
    }
  };

  const cols: Column<Cliente>[] = [
    {
      key: "name",
      header: "Cliente",
      cell: (row) => (
        <strong>
          {row.razonSocial || `${row.nombre} ${row.apellido ?? ""}`.trim()}
        </strong>
      ),
    },
    { key: "doc", header: "Documento", cell: (row) => row.documento },
    {
      key: "contact",
      header: "Contacto",
      cell: (row) => (
        <>
          {row.telefono || "Sin teléfono"}
          <small className="muted display-block">
            {row.email || "Sin correo electrónico"}
          </small>
        </>
      ),
    },
    {
      key: "type",
      header: "Tipo",
      cell: (row) => <StatusBadge value={row.tipoCliente} />,
    },
    {
      key: "state",
      header: "Estado",
      cell: (row) => <StatusBadge value={row.activo} />,
    },
    {
      key: "actions",
      header: "Acciones",
      cell: (row) => (
        <div className="actions-row">
          <Link
            className="button button--secondary"
            to={`/app/clientes/${row.id}/editar`}
          >
            <Pencil size={16} aria-hidden="true" />
            Editar
          </Link>
          {row.activo && (
            <button
              type="button"
              className="button button--danger"
              onClick={() => deactivate(row.id)}
              aria-label={`Desactivar ${row.razonSocial || row.nombre}`}
            >
              <UserX size={16} aria-hidden="true" />
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
            <Plus size={17} aria-hidden="true" />
            Nuevo cliente
          </Link>
        }
      />

      <form
        className="toolbar"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          applySearch();
        }}
      >
        <label className="field">
          <span>Buscar</span>
          <input
            placeholder="Nombre, apellido o documento"
            value={queryDraft}
            maxLength={MAX_QUERY_LENGTH}
            onChange={(event) => setQueryDraft(event.target.value)}
          />
        </label>
        <button type="submit" className="button" disabled={loading}>
          <Search size={17} aria-hidden="true" />
          Buscar
        </button>
        {(query || queryDraft) && (
          <button
            type="button"
            className="button button--secondary"
            onClick={clearSearch}
            disabled={loading}
          >
            <X size={17} aria-hidden="true" />
            Limpiar
          </button>
        )}
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
            caption={`${data?.totalElements ?? rows.length} clientes encontrados`}
          />
          <PaginationControls
            page={data?.number ?? 0}
            totalPages={data?.totalPages ?? 0}
            totalElements={data?.totalElements ?? 0}
            onPageChange={setPage}
          />
        </>
      ) : (
        <EmptyState
          title={query ? "No hay clientes con esa búsqueda" : "No hay clientes registrados"}
        />
      )}
    </>
  );
}
