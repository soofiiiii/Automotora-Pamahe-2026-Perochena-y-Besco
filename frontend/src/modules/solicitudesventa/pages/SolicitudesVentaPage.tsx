import { Eye } from "lucide-react";
import { useCallback } from "react";
import { Link } from "react-router-dom";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { solicitudVentaService } from "../../../services/api";
import { EmptyState } from "../../../shared/feedback/EmptyState";
import { ErrorState } from "../../../shared/feedback/ErrorState";
import { LoadingState } from "../../../shared/feedback/LoadingState";
import { DataTable, type Column } from "../../../shared/tables/DataTable";
import { PageHeader } from "../../../shared/ui/PageHeader";
import type { SolicitudVentaResumen } from "../../../types/solicitudVenta.types";
import { formatDate } from "../../../utils/formatDate";

const statusLabels = { PENDIENTE: "Pendiente", EN_REVISION: "En revisión", CONTACTADA: "Contactada", DESCARTADA: "Descartada" } as const;

export default function SolicitudesVentaPage() {
  const load = useCallback(() => solicitudVentaService.list(), []);
  const { data, loading, error, retry } = useApiQuery(load);
  const rows = data ?? [];
  const columns: Column<SolicitudVentaResumen>[] = [
    { key: "id", header: "Solicitud", cell: (row) => `#${row.id}` },
    { key: "contact", header: "Contacto", cell: (row) => <><strong>{row.nombre}</strong><br /><small>{row.telefono}</small></> },
    { key: "vehicle", header: "Vehículo", cell: (row) => `${row.marca} ${row.modelo} · ${row.anio}` },
    { key: "km", header: "Kilometraje", cell: (row) => `${new Intl.NumberFormat("es-UY").format(row.kilometraje)} km` },
    { key: "photos", header: "Fotos", cell: (row) => String(row.cantidadFotografias) },
    { key: "status", header: "Estado", cell: (row) => statusLabels[row.estado] },
    { key: "date", header: "Recibida", cell: (row) => formatDate(row.creadaEn) },
    { key: "actions", header: "Acciones", cell: (row) => <Link className="button button--secondary" to={`/app/solicitudes-venta/${row.id}`}><Eye size={16} /> Ver</Link> },
  ];

  return <>
    <PageHeader title="Solicitudes para vender vehículos" description="Propuestas recibidas desde el formulario público para revisión comercial interna." />
    {loading ? <LoadingState /> : error ? <ErrorState description={error} onRetry={retry} /> : rows.length ? <DataTable rows={rows} columns={columns} keyOf={(row) => row.id} caption={`${rows.length} solicitudes recibidas`} /> : <EmptyState title="No hay solicitudes recibidas" />}
  </>;
}
