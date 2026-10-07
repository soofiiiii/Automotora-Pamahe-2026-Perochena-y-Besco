import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, useWatch, type DefaultValues } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import {
  INTERNAL_OBSERVATIONS_ROLES,
  PURCHASE_RECEIPT_ROLES,
  hasAnyRole,
} from "../../../config/permissions";
import { useAuth } from "../../../hooks/useAuth";
import { useUsdUyuRate } from "../../../hooks/useUsdUyuRate";
import { clienteService, compraService } from "../../../services/api";
import { ReceiptDownloadButton } from "../../../shared/components/ReceiptDownloadButton";
import { FormField } from "../../../shared/forms/FormField";
import { useToast } from "../../../shared/feedback/useToast";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { VehicleTypeField } from "../../../shared/vehicles/VehicleTypeField";
import {
  hasCompraFinancialData,
  type Cliente,
  type CompraCreateResponse,
  type DestinoPostCompra,
} from "../../../types/domain.types";
import { errorMessage } from "../../../utils/errorMessage";
import { convertUsdToUyu, formatCurrency } from "../../../utils/formatCurrency";
import { todayIso } from "../../../utils/formatDate";
import { MAX_VEHICLE_YEAR, MIN_VEHICLE_YEAR } from "../../../utils/vehicleYear";

const schema = z.object({
  marca: z.string().trim().min(2, "Ingresá la marca.").max(80, "La marca no puede superar los 80 caracteres."),
  modelo: z.string().trim().min(1, "Ingresá el modelo.").max(80, "El modelo no puede superar los 80 caracteres."),
  tipoVehiculo: z.string().trim().max(50, "El tipo de vehículo no puede superar los 50 caracteres.").optional(),
  anio: z.number({ error: "Ingresá el año del vehículo." }).int("El año debe ser un número entero.").min(MIN_VEHICLE_YEAR, `El año no puede ser anterior a ${MIN_VEHICLE_YEAR}.`).max(MAX_VEHICLE_YEAR, `El año no puede ser posterior a ${MAX_VEHICLE_YEAR}.`),
  matricula: z.string().trim().max(30, "La matrícula no puede superar los 30 caracteres.").optional(),
  numeroChasis: z.string().trim().max(80, "El número de chasis no puede superar los 80 caracteres.").optional(),
  color: z.string().trim().max(60, "El color no puede superar los 60 caracteres.").optional(),
  kilometraje: z.number({ error: "Ingresá un kilometraje válido." }).int("El kilometraje debe ser un número entero.").min(0, "El kilometraje no puede ser negativo.").optional(),
  ubicacionActual: z.enum(["LOCAL", "TALLER_INTERNO", "TALLER_EXTERNO", "EN_TRASLADO", "OTRO"]),
  precioVentaUsd: z.number({ error: "Ingresá un precio válido en USD." }).min(0, "El precio en USD no puede ser negativo.").optional(),
  descripcionPublica: z.string().trim().max(1000, "La descripción pública no puede superar los 1000 caracteres.").optional(),
  observacionesInternas: z.string().trim().max(1000, "Las observaciones internas no pueden superar los 1000 caracteres.").optional(),
  clienteVendedorId: z.number({ error: "Seleccioná un cliente vendedor." }).int("Seleccioná un cliente vendedor válido.").positive("Seleccioná un cliente vendedor."),
  fechaCompra: z.string().min(10, "Seleccioná la fecha de compra."),
  costoAdquisicion: z.number({ error: "Ingresá el costo de adquisición." }).positive("El costo de adquisición debe ser mayor que cero."),
  observacionesCompra: z.string().trim().max(1000, "Las observaciones no pueden superar los 1000 caracteres.").optional(),
});

type Values = z.infer<typeof schema>;
type Origin = "compra" | "vehiculo";

const defaultValues: DefaultValues<Values> = {
  marca: "",
  modelo: "",
  tipoVehiculo: "",
  anio: new Date().getFullYear(),
  matricula: "",
  numeroChasis: "",
  color: "",
  kilometraje: 0,
  ubicacionActual: "LOCAL",
  descripcionPublica: "",
  observacionesInternas: "",
  fechaCompra: todayIso(),
  observacionesCompra: "",
};

export function CompraVehiculoForm({ origin }: { origin: Origin }) {
  const { show } = useToast();
  const { session } = useAuth();
  const usdUyuRate = useUsdUyuRate();
  const roles = session?.roles ?? [];
  const canDownloadPurchaseReceipt = hasAnyRole(roles, PURCHASE_RECEIPT_ROLES);
  const canEditInternalObservations = hasAnyRole(roles, INTERNAL_OBSERVATIONS_ROLES);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [createdPurchase, setCreatedPurchase] = useState<CompraCreateResponse | null>(null);
  const [destinationSaving, setDestinationSaving] = useState(false);
  const [destinationState, setDestinationState] = useState<"EN_TALLER" | "DISPONIBLE" | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues });

  useEffect(() => {
    clienteService
      .list()
      .then((rows) =>
        setClients(
          rows.filter(
            (client) =>
              client.activo &&
              (client.tipoCliente === "VENDEDOR" || client.tipoCliente === "AMBOS"),
          ),
        ),
      )
      .catch((error) =>
        show(
          errorMessage(error, "No pudimos cargar los clientes vendedores."),
          "error",
        ),
      );
  }, [show]);

  const tipoVehiculo = useWatch({ control, name: "tipoVehiculo" }) ?? "";
  const precioVentaUsd = useWatch({ control, name: "precioVentaUsd" });
  const precioVentaUyu = convertUsdToUyu(precioVentaUsd, usdUyuRate);

  const definePostPurchaseDestination = async (destino: DestinoPostCompra) => {
    if (!createdPurchase) return;
    setDestinationSaving(true);
    try {
      const result = await compraService.defineDestination(createdPurchase.id, destino);
      setDestinationState(result.estadoVehiculo);
      show(
        result.estadoVehiculo === "EN_TALLER"
          ? "El vehículo quedó en taller para continuar su preparación."
          : "El vehículo quedó disponible para la venta.",
        "success",
      );
    } catch (error) {
      show(errorMessage(error, "No pudimos definir el destino del vehículo."), "error");
    } finally {
      setDestinationSaving(false);
    }
  };

  if (createdPurchase) {
    const canAccessPurchaseReceipt =
      canDownloadPurchaseReceipt && hasCompraFinancialData(createdPurchase);

    return (
      <>
        <PageHeader
          title={`Compra #${createdPurchase.id} registrada`}
          description={
            canAccessPurchaseReceipt
              ? "El vehículo y su compra se registraron en una única operación. El comprobante PDF está disponible para descarga."
              : "El vehículo y su compra se registraron correctamente en una única operación."
          }
        />
        <section className="card receipt-success" aria-live="polite">
          <div>
            <h2>Vehículo y compra registrados correctamente</h2>
            <p className="muted">
              {canAccessPurchaseReceipt
                ? "Guardá el comprobante como respaldo interno de la operación."
                : "La unidad quedó vinculada a esta compra desde su ingreso."}
            </p>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3>¿Qué necesita esta unidad ahora?</h3>
            {destinationState ? (
              <p className="notice" role="status">
                Estado definido: {destinationState === "EN_TALLER" ? "En taller" : "Disponible"}.
              </p>
            ) : (
              <>
                <p className="muted">
                  Elegí si el vehículo necesita trabajos antes de ofrecerse o si puede quedar disponible inmediatamente.
                </p>
                <div className="actions-row">
                  <button
                    type="button"
                    className="button button--secondary"
                    disabled={destinationSaving}
                    onClick={() => void definePostPurchaseDestination("REQUIERE_TALLER")}
                  >
                    Requiere taller
                  </button>
                  <button
                    type="button"
                    className="button"
                    disabled={destinationSaving}
                    onClick={() => void definePostPurchaseDestination("PUEDE_QUEDAR_DISPONIBLE")}
                  >
                    Puede quedar disponible
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="actions-row">
            {canAccessPurchaseReceipt && (
              <ReceiptDownloadButton kind="compra" operationId={createdPurchase.id} />
            )}
            {canDownloadPurchaseReceipt && (
              <Link className="button button--secondary" to="/app/compras">
                Volver a compras
              </Link>
            )}
            <Link className="button button--secondary" to={`/app/vehiculos/${createdPurchase.vehiculoId}`}>
              Ver vehículo
            </Link>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => {
                setCreatedPurchase(null);
                setDestinationState(null);
                reset(defaultValues);
              }}
            >
              Registrar otro ingreso
            </button>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={origin === "compra" ? "Registrar compra e ingreso de vehículo" : "Nuevo vehículo y compra"}
        description="Los datos del vehículo y de la compra se guardan juntos para evitar cargas duplicadas o asociaciones incorrectas."
      />
      <form
        className="card"
        onSubmit={handleSubmit(async (values) => {
          try {
            const purchase = await compraService.createWithVehicle({
              vehiculo: {
                marca: values.marca.trim(),
                modelo: values.modelo.trim(),
                tipoVehiculo: values.tipoVehiculo?.trim() || undefined,
                anio: values.anio,
                matricula: values.matricula?.trim().toUpperCase() || undefined,
                numeroChasis: values.numeroChasis?.trim().toUpperCase() || undefined,
                color: values.color?.trim() || undefined,
                kilometraje: values.kilometraje,
                ubicacionActual: values.ubicacionActual,
                precioVentaUsd: values.precioVentaUsd,
                descripcionPublica: values.descripcionPublica?.trim() || undefined,
                ...(canEditInternalObservations
                  ? { observacionesInternas: values.observacionesInternas?.trim() || undefined }
                  : {}),
              },
              clienteVendedorId: values.clienteVendedorId,
              fechaCompra: values.fechaCompra,
              costoAdquisicion: values.costoAdquisicion,
              observaciones: values.observacionesCompra?.trim() || undefined,
            });
            setCreatedPurchase(purchase);
            setDestinationState(null);
            show("Vehículo y compra registrados correctamente.", "success");
          } catch (error) {
            show(errorMessage(error, "No pudimos registrar el vehículo y la compra."), "error");
          }
        })}
      >
        <h2>Datos del vehículo</h2>
        <div className="form-grid">
          <FormField label="Marca" error={errors.marca?.message}>
            <input {...register("marca")} />
          </FormField>
          <FormField label="Modelo" error={errors.modelo?.message}>
            <input {...register("modelo")} />
          </FormField>
          <VehicleTypeField
            value={tipoVehiculo}
            onChange={(value) => setValue("tipoVehiculo", value, { shouldDirty: true })}
            emptyLabel="Sin especificar"
          />
          <FormField label="Año" error={errors.anio?.message}>
            <input
              type="number"
              min={MIN_VEHICLE_YEAR}
              max={MAX_VEHICLE_YEAR}
              {...register("anio", { valueAsNumber: true })}
            />
          </FormField>
          <FormField label="Matrícula (opcional)" error={errors.matricula?.message}>
            <input autoCapitalize="characters" {...register("matricula")} />
          </FormField>
          <FormField label="Número de chasis / VIN (opcional)" error={errors.numeroChasis?.message}>
            <input autoCapitalize="characters" {...register("numeroChasis")} />
          </FormField>
          <FormField label="Color" error={errors.color?.message}>
            <input {...register("color")} />
          </FormField>
          <FormField label="Kilometraje" error={errors.kilometraje?.message}>
            <input
              type="number"
              min="0"
              step="1"
              {...register("kilometraje", {
                setValueAs: (value) => (value === "" ? undefined : Number(value)),
              })}
            />
          </FormField>
          <FormField label="Ubicación física actual" error={errors.ubicacionActual?.message}>
            <select {...register("ubicacionActual")}>
              <option value="LOCAL">Local</option>
              <option value="TALLER_INTERNO">Taller interno</option>
              <option value="TALLER_EXTERNO">Taller externo</option>
              <option value="EN_TRASLADO">En traslado</option>
              <option value="OTRO">Otro</option>
            </select>
          </FormField>
          <FormField
            label="Precio de venta estimado (USD)"
            error={errors.precioVentaUsd?.message}
            hint={
              usdUyuRate == null
                ? "Cotización USD/UYU no disponible para previsualización."
                : precioVentaUyu == null
                  ? `Cotización actual: 1 USD = ${formatCurrency(usdUyuRate)}`
                  : `Cotización actual: 1 USD = ${formatCurrency(usdUyuRate)} · Equivalente: ${formatCurrency(precioVentaUyu)}`
            }
          >
            <input
              type="number"
              min="0"
              step="1"
              {...register("precioVentaUsd", {
                setValueAs: (value) => (value === "" ? undefined : Number(value)),
              })}
            />
          </FormField>
          <FormField label="Descripción pública" error={errors.descripcionPublica?.message}>
            <textarea {...register("descripcionPublica")} />
          </FormField>
          {canEditInternalObservations && (
            <FormField label="Observaciones internas" error={errors.observacionesInternas?.message}>
              <textarea {...register("observacionesInternas")} />
            </FormField>
          )}
        </div>

        <h2 style={{ marginTop: 24 }}>Datos de la compra</h2>
        <div className="form-grid">
          <FormField label="Cliente vendedor" error={errors.clienteVendedorId?.message}>
            <select {...register("clienteVendedorId", { valueAsNumber: true })}>
              <option value="">Seleccionar…</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.razonSocial || `${client.nombre} ${client.apellido ?? ""}`} · {client.documento}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Fecha de compra" error={errors.fechaCompra?.message}>
            <input type="date" max={todayIso()} {...register("fechaCompra")} />
          </FormField>
          <FormField label="Costo de adquisición" error={errors.costoAdquisicion?.message}>
            <input
              type="number"
              min="0.01"
              step="0.01"
              {...register("costoAdquisicion", { valueAsNumber: true })}
            />
          </FormField>
          <FormField label="Observaciones de compra" error={errors.observacionesCompra?.message}>
            <textarea {...register("observacionesCompra")} />
          </FormField>
        </div>

        <div className="form-actions">
          <Link
            className="button button--secondary"
            to={origin === "vehiculo" ? "/app/vehiculos" : canDownloadPurchaseReceipt ? "/app/compras" : "/app"}
          >
            Cancelar
          </Link>
          <button className="button" disabled={isSubmitting}>
            {isSubmitting ? "Registrando…" : "Registrar vehículo y compra"}
          </button>
        </div>
      </form>
    </>
  );
}
