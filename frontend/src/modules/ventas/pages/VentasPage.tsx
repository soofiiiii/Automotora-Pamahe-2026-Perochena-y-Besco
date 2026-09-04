import { Eye, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ventaService } from "../../../services/api";
import type { Venta } from "../../../types/domain.types";
import { DataTable, type Column } from "../../../shared/tables/DataTable";
import { LoadingState } from "../../../shared/feedback/LoadingState";
import { EmptyState } from "../../../shared/feedback/EmptyState";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { DownloadButton } from "../../../shared/components/DownloadButton";
import { useToast } from "../../../shared/feedback/useToast";
import { formatCurrency } from "../../../utils/formatCurrency";
import { formatDate } from "../../../utils/formatDate";
import { errorMessage } from "../../../utils/errorMessage";

export default function VentasPage() {
  const [rows, setRows] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const { show } = useToast();

  useEffect(() => {
    ventaService
      .list()
      .then(setRows)
      .catch((e) => show(errorMessage(e), "error"))
      .finally(() => setLoading(false));
  }, [show]);

  const cols: Column<Venta>[] = [
    { key: "id", header: "Venta", cell: (r) => `#${r.id}` },
    { key: "vehicle", header: "Vehículo", cell: (r) => `ID ${r.vehiculoId}` },
    {
      key: "buyer",
      header: "Comprador",
      cell: (r) => `ID ${r.clienteCompradorId}`,
    },
    { key: "date", header: "Fecha", cell: (r) => formatDate(r.fechaVenta) },
    {
      key: "price",
      header: "Precio final",
      cell: (r) => (
        <span className="money">{formatCurrency(r.precioFinal)}</span>
      ),
    },
    {
      key: "a",
      header: "Acciones",
      cell: (r) => (
        <div className="actions-row">
          <Link className="button button--secondary" to={`/app/ventas/${r.id}`}>
            <Eye size={16} />
            Ver
          </Link>
          <DownloadButton
            load={() => ventaService.receipt(r.id)}
            filename={`venta-${r.id}.pdf`}
            label="PDF"
          />
        </div>
      ),
    },
  ];
  return (
    <>
      <PageHeader
        title="Ventas"
        description="Cierre comercial del ciclo del vehículo y emisión del comprobante interno."
        actions={
          <Link className="button" to="/app/ventas/nueva">
            <Plus size={17} />
            Registrar venta
          </Link>
        }
      />
      {loading ? (
        <LoadingState />
      ) : rows.length ? (
        <DataTable rows={rows} columns={cols} keyOf={(r) => r.id} />
      ) : (
        <EmptyState title="No hay ventas registradas" />
      )}
    </>
  );
}
