import { Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { PAGE_SIZE } from "../../../config/appConfig";
import { MANAGEMENT_ROLES, hasAnyRole } from "../../../config/permissions";
import { useAuth } from "../../../hooks/useAuth";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { compraService } from "../../../services/api";
import { ReceiptDownloadButton } from "../../../shared/components/ReceiptDownloadButton";
import { EmptyState } from "../../../shared/feedback/EmptyState";
import { ErrorState } from "../../../shared/feedback/ErrorState";
import { LoadingState } from "../../../shared/feedback/LoadingState";
import { PaginationControls } from "../../../shared/navigation/PaginationControls";
import { DataTable, type Column } from "../../../shared/tables/DataTable";
import { PageHeader } from "../../../shared/ui/PageHeader";
import type { Compra } from "../../../types/domain.types";
import { formatCurrency } from "../../../utils/formatCurrency";
import { formatDate } from "../../../utils/formatDate";

export default function ComprasPage() {
  const { session } = useAuth();
  const management = hasAnyRole(session?.roles ?? [], MANAGEMENT_ROLES);
  const [page, setPage] = useState(0);

  const load = useCallback(
    async (signal: AbortSignal) => {
      if (!management) {
        return {
          content: [] as Compra[],
          number: 0,
          size: PAGE_SIZE,
          totalElements: 0,
          totalPages: 0,
          serverPaged: false,
        };
      }

      return compraService.page(
        { page, size: PAGE_SIZE, sort: "fechaCompra,desc" },
        signal,
      );
    },
    [management, page],
  );

  const { data, loading, error, retry } = useApiQuery(load);
  const rows = data?.content ?? [];

  const cols: Column<Compra>[] = [
    { key: "id", header: "Operación", cell: (row) => `#${row.id}` },
    {
      key: "vehicle",
      header: "Vehículo",
      cell: (row) => row.vehiculo || `ID ${row.vehiculoId}`,
    },
    {
      key: "seller",
      header: "Cliente vendedor",
      cell: (row) => row.clienteVendedor || `ID ${row.clienteVendedorId}`,
    },
    { key: "date", header: "Fecha", cell: (row) => formatDate(row.fechaCompra) },
    {
      key: "cost",
      header: "Costo adquisición",
      cell: (row) => (
        <span className="money">{formatCurrency(row.costoAdquisicion)}</span>
      ),
    },
    {
      key: "pdf",
      header: "Comprobante",
      cell: (row) => (
        <ReceiptDownloadButton kind="compra" operationId={row.id} compact />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Compras"
        description={
          management
            ? "Registro de ingreso comercial, costo inicial y comprobantes de las operaciones de compra."
            : "La consulta histórica de compras está reservada a Dueño/Administrador."
        }
        actions={
          <Link className="button" to="/app/compras/nueva">
            <Plus size={17} aria-hidden="true" />
            Registrar compra
          </Link>
        }
      />

      {!management ? (
        <div className="notice">
          Por seguridad financiera, el historial de compras y sus comprobantes
          está reservado a los perfiles Dueño/Administrador.
        </div>
      ) : loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState description={error} onRetry={retry} />
      ) : rows.length ? (
        <>
          <DataTable
            rows={rows}
            columns={cols}
            keyOf={(row) => row.id}
            caption={`${data?.totalElements ?? rows.length} compras registradas`}
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
        <EmptyState title="No hay compras registradas" />
      )}
    </>
  );
}
