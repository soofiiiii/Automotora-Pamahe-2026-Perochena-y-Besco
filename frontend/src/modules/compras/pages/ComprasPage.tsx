import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MANAGEMENT_ROLES, hasAnyRole } from "../../../config/permissions";
import { useAuth } from "../../../hooks/useAuth";
import { compraService } from "../../../services/api";
import type { Compra } from "../../../types/domain.types";
import { LoadingState } from "../../../shared/feedback/LoadingState";
import { EmptyState } from "../../../shared/feedback/EmptyState";
import { DataTable, type Column } from "../../../shared/tables/DataTable";
import { DownloadButton } from "../../../shared/components/DownloadButton";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { useToast } from "../../../shared/feedback/useToast";
import { formatCurrency } from "../../../utils/formatCurrency";
import { formatDate } from "../../../utils/formatDate";
import { errorMessage } from "../../../utils/errorMessage";

export default function ComprasPage() {
  const { session } = useAuth();
  const management = hasAnyRole(session?.roles ?? [], MANAGEMENT_ROLES);
  const [rows, setRows] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const { show } = useToast();

  useEffect(() => {
    if (!management) return;

    let cancelled = false;

    compraService
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
  }, [management, show]);

  const cols: Column<Compra>[] = [
    { key: "id", header: "Operación", cell: (r) => `#${r.id}` },
    { key: "vehicle", header: "Vehículo", cell: (r) => `ID ${r.vehiculoId}` },
    {
      key: "seller",
      header: "Cliente vendedor",
      cell: (r) => `ID ${r.clienteVendedorId}`,
    },
    { key: "date", header: "Fecha", cell: (r) => formatDate(r.fechaCompra) },
    {
      key: "cost",
      header: "Costo adquisición",
      cell: (r) => (
        <span className="money">{formatCurrency(r.costoAdquisicion)}</span>
      ),
    },
    {
      key: "pdf",
      header: "Comprobante",
      cell: (r) => (
        <DownloadButton
          load={() => compraService.receipt(r.id)}
          filename={`compra-${r.id}.pdf`}
          label="PDF"
        />
      ),
    },
  ];
  return (
    <>
      <PageHeader
        title="Compras"
        description={
          management
            ? "Registro de ingreso comercial y costo inicial de cada unidad."
            : "Podés registrar compras. La consulta histórica y sus costos quedan reservados a Dueño/Administrador en esta interfaz."
        }
        actions={
          <Link className="button" to="/app/compras/nueva">
            <Plus size={17} />
            Registrar compra
          </Link>
        }
      />
      {!management ? (
        <div className="notice">
          Por seguridad financiera, el listado de costos de compra no está
          disponible para el perfil VENDEDOR.
        </div>
      ) : loading ? (
        <LoadingState />
      ) : rows.length ? (
        <DataTable rows={rows} columns={cols} keyOf={(r) => r.id} />
      ) : (
        <EmptyState title="No hay compras registradas" />
      )}
    </>
  );
}
