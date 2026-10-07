import { ArrowLeft, Pencil, ReceiptText } from "lucide-react";
import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  COMMERCIAL_ROLES,
  MANAGEMENT_ROLES,
  WORKSHOP_ROLES,
  hasAnyRole,
} from "../../../config/permissions";
import { useAuth } from "../../../hooks/useAuth";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { useUsdUyuRate } from "../../../hooks/useUsdUyuRate";
import { vehiculoService } from "../../../services/api";
import {
  hasCommercialData,
  hasManagementData,
  isVentaHistorialGerencial,
  type EstadoVehiculo,
} from "../../../types/vehiculo.types";
import { LoadingState } from "../../../shared/feedback/LoadingState";
import { ErrorState } from "../../../shared/feedback/ErrorState";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { StatusBadge } from "../../../shared/ui/StatusBadge";
import { useToast } from "../../../shared/feedback/useToast";
import { useConfirmDialog } from "../../../shared/feedback/useConfirmDialog";
import {
  convertUsdToUyu,
  formatCurrency,
  formatUsd,
  formatUyuEquivalent,
} from "../../../utils/formatCurrency";
import { formatDate } from "../../../utils/formatDate";
import { errorMessage } from "../../../utils/errorMessage";
import { calculateDaysInStock, formatDaysInStock } from "../../../utils/daysInStock";
import VehicleImages from "../components/VehicleImages";
import { VehicleHistoryEvents } from "../components/VehicleHistoryEvents";

const transitions: Record<EstadoVehiculo, EstadoVehiculo[]> = {
  COMPRADO: ["EN_TALLER", "DISPONIBLE", "DADO_DE_BAJA"],
  EN_TALLER: ["DISPONIBLE", "DADO_DE_BAJA"],
  DISPONIBLE: ["RESERVADO", "EN_TALLER", "DADO_DE_BAJA"],
  RESERVADO: ["DISPONIBLE"],
  VENDIDO: [],
  DADO_DE_BAJA: [],
};
const commercialTransitions: Partial<Record<EstadoVehiculo, EstadoVehiculo[]>> =
  {
    COMPRADO: ["DISPONIBLE"],
    EN_TALLER: ["DISPONIBLE"],
    DISPONIBLE: ["RESERVADO", "EN_TALLER"],
    RESERVADO: ["DISPONIBLE"],
  };
const workshopTransitions: Partial<Record<EstadoVehiculo, EstadoVehiculo[]>> = {
  COMPRADO: ["EN_TALLER"],
  EN_TALLER: ["DISPONIBLE"],
  DISPONIBLE: ["EN_TALLER"],
};
const money = (value?: number | null) =>
  value == null ? "No informado" : formatCurrency(value);

const locationLabels = {
  LOCAL: "Local",
  TALLER_INTERNO: "Taller interno",
  TALLER_EXTERNO: "Taller externo",
  EN_TRASLADO: "En traslado",
  OTRO: "Otro",
} as const;

export default function VehiculoDetailPage() {
  const id = Number(useParams().id);
  const { session } = useAuth();
  const usdUyuRate = useUsdUyuRate();
  const roles = session?.roles ?? [];
  const management = hasAnyRole(roles, MANAGEMENT_ROLES);
  const commercial = hasAnyRole(roles, COMMERCIAL_ROLES);
  const workshop = hasAnyRole(roles, WORKSHOP_ROLES);
  const { show } = useToast();
  const { confirm } = useConfirmDialog();
  const [busy, setBusy] = useState(false);
  const [deactivated, setDeactivated] = useState<number>();
  const load = useCallback(
    async (signal: AbortSignal) => {
      if (!Number.isSafeInteger(id) || id <= 0)
        throw new Error("El enlace del vehículo no es válido.");
      return vehiculoService.historial(id, signal);
    },
    [id],
  );
  const { data: history, loading, error, retry } = useApiQuery(load);
  if (loading) return <LoadingState label="Cargando vehículo…" />;
  if (error || !history)
    return (
      <ErrorState
        title="No pudimos abrir el vehículo"
        description={error}
        onRetry={retry}
      />
    );
  const vehicle = history.vehiculo;
  const active = vehicle.activo && deactivated !== id;
  const purchase = "compra" in history ? history.compra : null;
  const sale = "venta" in history ? history.venta : null;
  const purchaseDate =
    "fechaCompra" in history ? history.fechaCompra : purchase?.fechaCompra;
  const saleDate =
    "fechaVenta" in history ? history.fechaVenta : sale?.fechaVenta;
  const daysInStock = calculateDaysInStock(purchaseDate, saleDate);
  const economicSale =
    management && isVentaHistorialGerencial(sale) ? sale : null;
  const allowed = !active
    ? []
    : management
      ? transitions[vehicle.estado]
      : hasAnyRole(roles, ["VENDEDOR"])
        ? (commercialTransitions[vehicle.estado] ?? [])
        : (workshopTransitions[vehicle.estado] ?? []);
  const mutate = async (action: () => Promise<unknown>, message: string) => {
    setBusy(true);
    try {
      await action();
      show(message, "success");
      retry();
    } catch (cause) {
      show(errorMessage(cause, "No pudimos actualizar el vehículo."), "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <PageHeader
        title={`${vehicle.marca} ${vehicle.modelo}`}
        description={`${vehicle.anio} · ${vehicle.matricula || "Sin matrícula"}`}
        actions={
          <>
            <Link className="button button--secondary" to="/app/vehiculos">
              <ArrowLeft size={17} />
              Volver
            </Link>
            {commercial && active && vehicle.estado === "DISPONIBLE" && (
              <Link className="button" to={`/app/ventas/nueva?vehiculoId=${id}`}>
                <ReceiptText size={17} />
                Registrar venta
              </Link>
            )}
            {commercial && active && (
              <Link className="button" to={`/app/vehiculos/${id}/editar`}>
                <Pencil size={17} />
                Editar
              </Link>
            )}
          </>
        }
      />
      {deactivated === id && (
        <p className="notice" role="status">
          El vehículo fue dado de baja. Se conserva su historial.
        </p>
      )}
      <div className="split">
        <div className="grid">
          <section className="card">
            <div className="section-title">
              <h2>Datos generales</h2>
              <StatusBadge
                value={deactivated === id ? "DADO_DE_BAJA" : vehicle.estado}
              />
            </div>
            <div className="detail-list">
              <Detail
                label="Tipo"
                value={vehicle.tipoVehiculoLabel ?? vehicle.tipoVehiculo ?? "Sin especificar"}
              />
              <Detail label="Color" value={vehicle.color} />
              <Detail label="Ubicación actual" value={locationLabels[vehicle.ubicacionActual]} />
              <Detail
                label="Kilometraje"
                value={
                  vehicle.kilometraje == null
                    ? null
                    : `${Intl.NumberFormat("es-UY").format(vehicle.kilometraje)} km`
                }
              />
              <Detail label="Chasis" value={vehicle.numeroChasis} />
              <Detail label="Días en stock" value={formatDaysInStock(daysInStock)} />
              {commercial && hasCommercialData(vehicle) && (
                <>
                  <PriceDetail
                    usd={vehicle.precioVentaUsd}
                    uyu={
                      convertUsdToUyu(vehicle.precioVentaUsd, usdUyuRate)
                        ?? vehicle.precioVentaEstimado
                    }
                  />
                  <Detail
                    label="Catálogo"
                    value={vehicle.publicado ? "Publicado" : "No publicado"}
                  />
                </>
              )}
              <Detail label="Activo" value={active ? "Sí" : "No"} />
            </div>
            {vehicle.descripcionPublica && (
              <>
                <h3>Descripción pública</h3>
                <p>{vehicle.descripcionPublica}</p>
              </>
            )}
            {management &&
              hasManagementData(vehicle) &&
              vehicle.observacionesInternas && (
                <>
                  <h3>Observaciones internas</h3>
                  <p>{vehicle.observacionesInternas}</p>
                </>
              )}
          </section>
          <VehicleImages vehicleId={id} readOnly={!active} />
          <section className="card">
            <h2>Historial del vehículo</h2>
            {purchaseDate && (
              <div className="timeline-row">
                <div>
                  <strong>Compra</strong>
                  <p>{formatDate(purchaseDate)}</p>
                  {commercial && purchase && <p>Vendedor: {purchase.clienteVendedor}</p>}
                </div>
              </div>
            )}
            <h3>Refacciones y trabajos</h3>
            {history.refacciones.length ? (
              history.refacciones.map((repair) => (
                <div className="timeline-row" key={repair.id}>
                  <StatusBadge value={repair.estadoTarea} />
                  <div>
                    <strong>{repair.tipoTrabajo.replaceAll("_", " ")}</strong>
                    <p>{repair.descripcion}</p>
                    <small>{formatDate(repair.fecha)}</small>
                    {workshop && (
                      <p>
                        <Link to={`/app/taller/${repair.id}?vehiculoId=${id}`}>
                          Abrir detalle del trabajo
                        </Link>
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="muted">
                No hay refacciones registradas para esta unidad.
              </p>
            )}
            {saleDate && (
              <div className="timeline-row">
                <div>
                  <strong>Venta</strong>
                  <p>{formatDate(saleDate)}</p>
                  {commercial && sale && (
                    <>
                      <p>Comprador: {sale.clienteComprador}</p>
                      <p>Precio final: {money(sale.precioFinal)}</p>
                    </>
                  )}
                </div>
              </div>
            )}
            <VehicleHistoryEvents eventos={history.eventos} />
          </section>
        </div>
        <aside className="grid">
          <section className="card">
            <h2>Estado operativo</h2>
            <div className="actions-row">
              {allowed.map((state) => (
                <button
                  className="button button--secondary"
                  type="button"
                  disabled={busy}
                  key={state}
                  onClick={() =>
                    void mutate(
                      () => vehiculoService.state(id, state),
                      "Estado actualizado.",
                    )
                  }
                >
                  {state.replaceAll("_", " ")}
                </button>
              ))}
              {!allowed.length && (
                <p className="muted">
                  No hay transiciones manuales disponibles.
                </p>
              )}
            </div>
          </section>
          {active &&
            commercial &&
            hasCommercialData(vehicle) &&
            (vehicle.estado === "DISPONIBLE" || vehicle.estado === "RESERVADO") && (
              <section className="card">
                <h2>Publicación</h2>
                <button
                  className="button button--accent"
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void mutate(
                      () => vehiculoService.publication(id, !vehicle.publicado),
                      "Publicación actualizada.",
                    )
                  }
                >
                  {vehicle.publicado
                    ? "Retirar del catálogo"
                    : "Publicar en catálogo"}
                </button>
              </section>
            )}
          {management && active && vehicle.estado !== "VENDIDO" && (
            <section className="card">
              <h2>Administración</h2>
              <p>La baja conserva el historial del vehículo.</p>
              <button
                className="button button--danger"
                type="button"
                disabled={busy}
                onClick={async () => {
                  const accepted = await confirm({
                    title: "Dar de baja vehículo",
                    message:
                      "El vehículo dejará de estar disponible para la operativa y el catálogo. Su historial se conservará.",
                    confirmLabel: "Dar de baja definitivamente",
                    requireSecondConfirm: true,
                  });
                  if (!accepted) return;
                  setBusy(true);
                  try {
                    await vehiculoService.deactivate(id);
                    setDeactivated(id);
                    show("Vehículo dado de baja correctamente.", "success");
                    retry();
                  } catch (cause) {
                    show(errorMessage(cause, "No pudimos actualizar el vehículo."), "error");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Dar de baja
              </button>
            </section>
          )}
          {management && (
            <section className="card">
              <h2>Resumen económico</h2>
              {economicSale ? (
                <div className="grid">
                  <Detail
                    label="Costo compra"
                    value={money(economicSale.costoCompraAlVender)}
                  />
                  <Detail
                    label="Refacciones"
                    value={money(economicSale.costoRefaccionesAlVender)}
                  />
                  <Detail
                    label="Costo total"
                    value={money(economicSale.costoTotalAlVender)}
                  />
                  <Detail
                    label="Precio final de venta"
                    value={money(economicSale.precioFinal)}
                  />
                  <Detail
                    label="Rentabilidad de la venta"
                    value={money(economicSale.rentabilidadCalculada)}
                  />
                  <p className="muted">
                    Rentabilidad = precio final de venta − costo total.
                  </p>
                </div>
              ) : (
                <p className="muted">
                  El resumen definitivo estará disponible cuando se registre la
                  venta.
                </p>
              )}
            </section>
          )}
        </aside>
      </div>
    </>
  );
}

function PriceDetail({
  usd,
  uyu,
}: {
  usd?: number | null;
  uyu?: number | null;
}) {
  return (
    <div className="detail-item">
      <small>Precio estimado</small>
      <strong>{usd == null ? "No informado" : formatUsd(usd)}</strong>
      {usd != null && uyu != null && (
        <small className="muted">{formatUyuEquivalent(uyu)}</small>
      )}
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="detail-item">
      <small>{label}</small>
      <strong>{value == null || value === "" ? "No informado" : value}</strong>
    </div>
  );
}