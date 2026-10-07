import { Eye, Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { PAGE_SIZE } from "../../../config/appConfig";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { ventaService } from "../../../services/api";
import { ReceiptDownloadButton } from "../../../shared/components/ReceiptDownloadButton";
import { EmptyState } from "../../../shared/feedback/EmptyState";
import { ErrorState } from "../../../shared/feedback/ErrorState";
import { LoadingState } from "../../../shared/feedback/LoadingState";
import { PaginationControls } from "../../../shared/navigation/PaginationControls";
import { DataTable, type Column } from "../../../shared/tables/DataTable";
import { PageHeader } from "../../../shared/ui/PageHeader";
import type { Venta } from "../../../types/domain.types";
import { formatCurrency } from "../../../utils/formatCurrency";
import { formatDate } from "../../../utils/formatDate";

export default function VentasPage() {
  const [page, setPage] = useState(0);

  const load = useCallback(
    (signal: AbortSignal) =>
      ventaService.page(
        { page, size: PAGE_SIZE, sort: "fechaVenta,desc" },
        signal,
      ),
    [page],
  );

  const { data, loading, error, retry } = useApiQuery(load);
  const rows = data?.content ?? [];

  const cols: Column<Venta>[] = [
    { key: "id", header: "Venta", cell: (row) => `#${row.id}` },
    {
      key: "vehicle",
      header: "Vehículo",
      cell: (row) => row.vehiculo || `ID ${row.vehiculoId}`,
    },
    {
      key: "buyer",
      header: "Comprador",
      cell: (row) => row.clienteComprador || `ID ${row.clienteCompradorId}`,
    },
    { key: "date", header: "Fecha", cell: (row) => formatDate(row.fechaVenta) },
    {
      key: "price",
      header: "Precio final",
      cell: (row) => (
        <span className="money">{formatCurrency(row.precioFinal)}</span>
      ),
    },
    {
      key: "actions",
      header: "Acciones",
      cell: (row) => (
        <div className="actions-row">
          <Link
            className="button button--secondary"
            to={`/app/ventas/${row.id}`}
          >
            <Eye size={16} aria-hidden="true" />
            Ver
          </Link>
          <ReceiptDownloadButton kind="venta" operationId={row.id} compact />
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Ventas"
        description="Cierre comercial del ciclo del vehículo y acceso al comprobante interno de cada operación."
        actions={
          <Link className="button" to="/app/ventas/nueva">
            <Plus size={17} aria-hidden="true" />
            Registrar venta
          </Link>
        }
      />
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
            caption={`${data?.totalElements ?? rows.length} ventas registradas`}
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
        <EmptyState title="No hay ventas registradas" />
      )}
    </>
  );
}
