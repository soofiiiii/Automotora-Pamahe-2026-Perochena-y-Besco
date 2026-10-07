import { useCallback } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { tallerService } from "../../../services/api";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { StatusBadge } from "../../../shared/ui/StatusBadge";
import { LoadingState } from "../../../shared/feedback/LoadingState";
import { ErrorState } from "../../../shared/feedback/ErrorState";
import { formatDate } from "../../../utils/formatDate";
import { formatCurrency } from "../../../utils/formatCurrency";
import { RepairEvidence } from "../components/RepairEvidence";
import VehicleImages from "../../vehiculos/components/VehicleImages";

export default function RefaccionDetailPage() {
  const id = Number(useParams().id);
  const [params] = useSearchParams();
  const candidate = Number(params.get("vehiculoId"));
  const vehicleId =
    Number.isSafeInteger(candidate) && candidate > 0 ? candidate : undefined;
  const load = useCallback(
    async (signal: AbortSignal) => {
      if (!Number.isSafeInteger(id) || id <= 0)
        throw new Error("El enlace de la refacción no es válido.");
      return tallerService.get(id, vehicleId, signal);
    },
    [id, vehicleId],
  );
  const { data: repair, loading, error, retry } = useApiQuery(load);
  if (loading) return <LoadingState label="Cargando refacción…" />;
  if (!repair || error)
    return <ErrorState description={error} onRetry={retry} />;
  const fields = [
    ["Fecha", formatDate(repair.fecha)],
    ["Tipo de trabajo", repair.tipoTrabajo.replaceAll("_", " ")],
    [
      "Responsable operativo",
      repair.responsableOperativo ||
        (repair.responsableOperativoId
          ? `Usuario #${repair.responsableOperativoId}`
          : "Sin responsable asignado"),
    ],
    [
      "Registrado por",
      repair.usuarioQueRegistra ||
        (repair.usuarioQueRegistraId
          ? `Usuario #${repair.usuarioQueRegistraId}`
          : "No informado"),
    ],
    ["Repuestos", formatCurrency(repair.costoRepuestos)],
    ["Mano de obra", formatCurrency(repair.costoManoObra)],
    ["Servicios externos", formatCurrency(repair.costoServiciosExternos)],
    ["Costo total", formatCurrency(repair.costoTotal)],
    [
      "Origen",
      repair.sincronizadoDesdeOffline
        ? "Registro sin conexión"
        : "Registro con conexión",
    ],
  ];
  return (
    <>
      <PageHeader
        title={`Refacción #${repair.id}`}
        description={repair.vehiculo || `Vehículo #${repair.vehiculoId}`}
        actions={
          <>
            <Link className="button button--secondary" to="/app/taller">
              Volver al taller
            </Link>
            <Link
              className="button"
              to={`/app/taller/${repair.id}/editar?vehiculoId=${repair.vehiculoId}`}
            >
              Editar tarea
            </Link>
          </>
        }
      />
      <div className="grid">
        <section className="card">
          <div className="section-title">
            <h2>Detalle del trabajo</h2>
            <StatusBadge value={repair.estadoTarea} />
          </div>
          <p>{repair.descripcion}</p>
          <div className="detail-list">
            {fields.map(([label, value]) => (
              <div className="detail-item" key={label}>
                <small>{label}</small>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <h3>Observaciones</h3>
          <p>{repair.observaciones || "Sin observaciones adicionales."}</p>
          <RepairEvidence value={repair.registroFotograficoUrl} />
          <div className="form-actions">
            <Link
              className="button button--secondary"
              to={`/app/vehiculos/${repair.vehiculoId}`}
            >
              Abrir vehículo
            </Link>
          </div>
        </section>
        <VehicleImages
          vehicleId={repair.vehiculoId}
          readOnly
          title="Imágenes generales del vehículo"
        />
      </div>
    </>
  );
}