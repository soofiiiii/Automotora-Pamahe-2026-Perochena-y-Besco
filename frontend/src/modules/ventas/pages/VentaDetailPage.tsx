import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MANAGEMENT_ROLES, hasAnyRole } from "../../../config/permissions";
import { useAuth } from "../../../hooks/useAuth";
import { ventaService } from "../../../services/api";
import type {
  EstadoFinanciacion,
  Venta,
  VentaDetalleGerencial,
} from "../../../types/domain.types";
import { LoadingState } from "../../../shared/feedback/LoadingState";
import { ErrorState } from "../../../shared/feedback/ErrorState";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { ReceiptDownloadButton } from "../../../shared/components/ReceiptDownloadButton";
import { FormField } from "../../../shared/forms/FormField";
import { useToast } from "../../../shared/feedback/useToast";
import { formatCurrency } from "../../../utils/formatCurrency";
import { formatDate } from "../../../utils/formatDate";
import { errorMessage } from "../../../utils/errorMessage";

const paymentLabels = {
  TRANSFERENCIA: "Transferencia",
  EFECTIVO: "Efectivo",
  FINANCIACION_BANCARIA: "Financiación bancaria",
  FINANCIACION_PROPIA: "Financiación propia",
  VEHICULO_PARTE_PAGO: "Vehículo como parte de pago",
} as const;

const channelLabels = {
  WHATSAPP: "WhatsApp",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  SITIO_WEB: "Sitio web",
  REFERIDO: "Referido",
  PRESENCIAL: "Presencial",
  OTRO: "Otro",
} as const;

const financingStateLabels = {
  PENDIENTE: "Pendiente",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
  PAGADA: "Pagada",
} as const;

const isFinancingSale = (sale: Venta) =>
  sale.medioPago === "FINANCIACION_BANCARIA" ||
  sale.medioPago === "FINANCIACION_PROPIA";

export default function VentaDetailPage() {
  const id = Number(useParams().id);
  const validId = Number.isInteger(id) && id > 0;
  const { session } = useAuth();
  const management = hasAnyRole(session?.roles ?? [], MANAGEMENT_ROLES);
  const { show } = useToast();
  const [sale, setSale] = useState<Venta | null>(null);
  const [detail, setDetail] = useState<VentaDetalleGerencial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingFollowUp, setSavingFollowUp] = useState(false);
  const [savingFinancing, setSavingFinancing] = useState(false);
  const [savingMaintenance, setSavingMaintenance] = useState(false);
  const [financialEntity, setFinancialEntity] = useState("");
  const [financedAmount, setFinancedAmount] = useState("");
  const [financingState, setFinancingState] = useState<EstadoFinanciacion>("PENDIENTE");
  const [maintenanceDate, setMaintenanceDate] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!validId) return;

    let cancelled = false;

    void ventaService
      .get(id)
      .then(async (saleData) => {
        if (cancelled) return;

        setSale(saleData);
        setError("");

        setFinancialEntity(saleData.entidadFinanciera ?? "");
        setFinancedAmount(
          saleData.montoFinanciado == null
            ? ""
            : String(saleData.montoFinanciado),
        );
        setFinancingState(
          saleData.estadoFinanciacion ?? "PENDIENTE",
        );
        setMaintenanceDate(saleData.proximoMantenimiento ?? "");

        if (management) {
          try {
            const managementDetail =
              await ventaService.gerencial(id);

            if (!cancelled) {
              setDetail(managementDetail);
            }
          } catch {
            if (!cancelled) {
              setDetail(null);
            }
          }
        } else {
          setDetail(null);
        }
      })
      .catch((cause) => {
        if (cancelled) return;

        setError(
          errorMessage(cause, "No pudimos cargar la venta."),
        );
        setSale(null);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, management, validId, reloadKey]);

  if (!validId) {
    return (
      <ErrorState
        title="No pudimos abrir la venta"
        description="El enlace de la venta no es válido."
      />
    );
  }

  if (loading) return <LoadingState label="Cargando venta…" />;

  if (error || !sale) {
    return (
      <ErrorState
        title="No pudimos abrir la venta"
        description={error || "La venta no está disponible."}
        onRetry={() => {
          setLoading(true);
          setError("");
          setReloadKey((current) => current + 1);
        }}
      />
    );
  }

  const financing = isFinancingSale(sale);

  const saveFinancing = async () => {
    const amount = Number(financedAmount);
    if (!financialEntity.trim()) {
      show("Ingresá la entidad financiera.", "error");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      show("Ingresá un monto financiado válido.", "error");
      return;
    }
    if (amount > sale.precioFinal) {
      show("El monto financiado no puede superar el precio final.", "error");
      return;
    }

    setSavingFinancing(true);
    try {
      const updated = await ventaService.updateFinancing(id, {
        entidadFinanciera: financialEntity.trim(),
        montoFinanciado: amount,
        estado: financingState,
      });
      setSale(updated);

      setFinancialEntity(updated.entidadFinanciera ?? "");
      setFinancedAmount(
        updated.montoFinanciado == null
          ? ""
          : String(updated.montoFinanciado),
      );
      setFinancingState(
        updated.estadoFinanciacion ?? "PENDIENTE",
      );
      show("Datos de financiación actualizados.", "success");
    } catch (cause) {
      show(errorMessage(cause, "No pudimos actualizar la financiación."), "error");
    } finally {
      setSavingFinancing(false);
    }
  };

  const saveMaintenance = async (nextDate: string | null = maintenanceDate || null) => {
    setSavingMaintenance(true);
    try {
      const updated = await ventaService.updateMaintenance(id, {
        proximoMantenimiento: nextDate,
      });
      setSale(updated);
      setMaintenanceDate(updated.proximoMantenimiento ?? "");
      show(
        updated.proximoMantenimiento
          ? "Próximo mantenimiento actualizado."
          : "Fecha de mantenimiento eliminada.",
        "success",
      );
    } catch (cause) {
      show(errorMessage(cause, "No pudimos actualizar el próximo mantenimiento."), "error");
    } finally {
      setSavingMaintenance(false);
    }
  };

  const markFollowUp = async () => {
    setSavingFollowUp(true);
    try {
      const updated = await ventaService.markPostSaleFollowUp(id);
      setSale(updated);
      show("Seguimiento postventa marcado como realizado.", "success");
    } catch (cause) {
      show(errorMessage(cause, "No pudimos registrar el seguimiento postventa."), "error");
    } finally {
      setSavingFollowUp(false);
    }
  };

  return (
    <>
      <PageHeader
        title={`Venta #${sale.id}`}
        description={`Registrada el ${formatDate(sale.fechaVenta)}`}
        actions={
          <>
            <Link className="button button--secondary" to="/app/ventas">
              Volver
            </Link>
            <ReceiptDownloadButton kind="venta" operationId={id} />
          </>
        }
      />

      <div className="grid grid--2">
        <section className="card">
          <h2>Operación</h2>
          <div className="detail-list">
            <Detail label="Vehículo" value={sale.vehiculo || `ID ${sale.vehiculoId}`} />
            <Detail
              label="Cliente comprador"
              value={sale.clienteComprador || `ID ${sale.clienteCompradorId}`}
            />
            <Detail label="Precio final" value={formatCurrency(sale.precioFinal)} />
            <Detail label="Fecha" value={formatDate(sale.fechaVenta)} />
            {sale.vendedor && <Detail label="Vendedor" value={sale.vendedor} />}
            <Detail
              label="Medio de pago"
              value={sale.medioPago ? paymentLabels[sale.medioPago] : "No informado"}
            />
            <Detail
              label="Origen del contacto"
              value={sale.canalOrigen ? channelLabels[sale.canalOrigen] : "No informado"}
            />
            <Detail
              label="Seguimiento postventa"
              value={sale.seguimientoPostventaRealizado ? "Realizado" : "Pendiente"}
            />
            <Detail
              label="Próximo mantenimiento"
              value={sale.proximoMantenimiento ? formatDate(sale.proximoMantenimiento) : "No definido"}
            />
          </div>
          {sale.observaciones && <p style={{ marginTop: 16 }}>{sale.observaciones}</p>}
          {!sale.seguimientoPostventaRealizado && (
            <div className="form-actions">
              <button
                type="button"
                className="button button--secondary"
                disabled={savingFollowUp}
                onClick={() => void markFollowUp()}
              >
                {savingFollowUp ? "Guardando…" : "Marcar seguimiento como realizado"}
              </button>
            </div>
          )}
        </section>

        <section className="card">
          <h2>Controles de cierre</h2>
          <div className="detail-list">
            <Detail
              label="Datos del comprador verificados"
              value={sale.datosCompradorVerificados ? "Sí" : "No"}
            />
            <Detail
              label="Documentación revisada"
              value={sale.documentacionRevisada ? "Sí" : "No"}
            />
            <Detail
              label="Cobro confirmado"
              value={sale.cobroConfirmado ? "Sí" : "No"}
            />
          </div>
        </section>

        <section className="card">
          <h2>Próximo mantenimiento</h2>
          <p className="muted">
            La fecha es opcional. El sistema avisará al vendedor y a administración cuando se aproxime.
          </p>
          <FormField label="Fecha prevista">
            <input
              type="date"
              value={maintenanceDate}
              onChange={(event) => setMaintenanceDate(event.target.value)}
            />
          </FormField>
          <div className="form-actions">
            <button
              type="button"
              className="button"
              disabled={savingMaintenance}
              onClick={() => void saveMaintenance()}
            >
              {savingMaintenance ? "Guardando…" : "Guardar fecha"}
            </button>
            {sale.proximoMantenimiento && (
              <button
                type="button"
                className="button button--secondary"
                disabled={savingMaintenance}
                onClick={() => void saveMaintenance(null)}
              >
                Quitar fecha
              </button>
            )}
          </div>
        </section>

        {financing && (
          <section className="card">
            <h2>Financiación</h2>
            <p className="muted">
              Estos datos describen la financiación de la operación; no representan pagos parciales ni una pasarela de cobro.
            </p>
            <div className="form-grid">
              <FormField label="Entidad financiera">
                <input
                  value={financialEntity}
                  maxLength={120}
                  onChange={(event) => setFinancialEntity(event.target.value)}
                />
              </FormField>
              <FormField label="Monto financiado">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={financedAmount}
                  onChange={(event) => setFinancedAmount(event.target.value)}
                />
              </FormField>
              <FormField label="Estado">
                <select
                  value={financingState}
                  onChange={(event) => setFinancingState(event.target.value as EstadoFinanciacion)}
                >
                  {Object.entries(financingStateLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="button"
                disabled={savingFinancing}
                onClick={() => void saveFinancing()}
              >
                {savingFinancing ? "Guardando…" : "Actualizar financiación"}
              </button>
            </div>
          </section>
        )}

        {management && (
          <section className="card">
            <h2>Detalle gerencial</h2>
            {detail ? (
              <div className="detail-list">
                <Detail label="Costo de compra al vender" value={formatCurrency(detail.costoCompraAlVender)} />
                <Detail label="Costo de refacciones al vender" value={formatCurrency(detail.costoRefaccionesAlVender)} />
                <Detail label="Costo total al vender" value={formatCurrency(detail.costoTotalAlVender)} />
                <Detail label="Rentabilidad calculada" value={formatCurrency(detail.rentabilidadCalculada)} />
                <Detail label="Estado comprobante" value={detail.estadoComprobante} />
              </div>
            ) : (
              <p className="muted">No hay detalle gerencial disponible.</p>
            )}
          </section>
        )}
      </div>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-item">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}
