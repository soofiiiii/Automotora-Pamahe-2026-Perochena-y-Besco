import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import {
  hasCommercialData,
  hasManagementData,
} from "../../../types/vehiculo.types";
import { VehicleTypeField } from "../../../shared/vehicles/VehicleTypeField";
import { vehiculoService } from "../../../services/api";
import {
  INTERNAL_OBSERVATIONS_ROLES,
  hasAnyRole,
} from "../../../config/permissions";
import { useAuth } from "../../../hooks/useAuth";
import { useUsdUyuRate } from "../../../hooks/useUsdUyuRate";
import { FormField } from "../../../shared/forms/FormField";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { useToast } from "../../../shared/feedback/useToast";
import { errorMessage } from "../../../utils/errorMessage";
import { convertUsdToUyu, formatCurrency } from "../../../utils/formatCurrency";
import { MAX_VEHICLE_YEAR, MIN_VEHICLE_YEAR } from "../../../utils/vehicleYear";
import { CompraVehiculoForm } from "../../compras/components/CompraVehiculoForm";

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
});

type Values = z.infer<typeof schema>;

export default function VehiculoFormPage() {
  const { id } = useParams();
  if (!id) return <CompraVehiculoForm origin="vehiculo" />;
  return <VehiculoEditForm id={Number(id)} />;
}

function VehiculoEditForm({ id }: { id: number }) {
  const nav = useNavigate();
  const { show } = useToast();
  const { session } = useAuth();
  const usdUyuRate = useUsdUyuRate();
  const [tipoVehiculoLabel, setTipoVehiculoLabel] = useState<string | null>(null);
  const canEditInternalObservations = hasAnyRole(
    session?.roles ?? [],
    INTERNAL_OBSERVATIONS_ROLES,
  );
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
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
    },
  });

  useEffect(() => {
    if (!Number.isSafeInteger(id) || id <= 0) {
      show("El identificador del vehículo no es válido.", "error");
      return;
    }
    vehiculoService
      .get(id)
      .then((vehicle) => {
        setTipoVehiculoLabel(vehicle.tipoVehiculoLabel);
        reset({
          marca: vehicle.marca,
          modelo: vehicle.modelo,
          tipoVehiculo: vehicle.tipoVehiculo ?? "",
          anio: vehicle.anio,
          matricula: vehicle.matricula ?? "",
          numeroChasis: vehicle.numeroChasis ?? "",
          color: vehicle.color ?? "",
          kilometraje: vehicle.kilometraje ?? 0,
          ubicacionActual: vehicle.ubicacionActual,
          precioVentaUsd: hasCommercialData(vehicle)
            ? (vehicle.precioVentaUsd ?? undefined)
            : undefined,
          descripcionPublica: vehicle.descripcionPublica ?? "",
          observacionesInternas: hasManagementData(vehicle)
            ? (vehicle.observacionesInternas ?? "")
            : "",
        });
      })
      .catch((error) =>
        show(errorMessage(error, "No pudimos cargar los datos del vehículo."), "error"),
      );
  }, [id, reset, show]);

  const tipoVehiculo = useWatch({ control, name: "tipoVehiculo" }) ?? "";
  const precioVentaUsd = useWatch({ control, name: "precioVentaUsd" });
  const precioVentaUyu = convertUsdToUyu(precioVentaUsd, usdUyuRate);

  return (
    <>
      <PageHeader
        title="Editar vehículo"
        description="Actualizá los datos técnicos y comerciales de la unidad. La compra asociada conserva su propio historial económico."
      />
      <form
        className="card"
        onSubmit={handleSubmit(async (values) => {
          try {
            const { observacionesInternas, ...vehicleValues } = values;
            const body = {
              ...vehicleValues,
              marca: values.marca.trim(),
              modelo: values.modelo.trim(),
              tipoVehiculo: values.tipoVehiculo?.trim() || undefined,
              matricula: values.matricula?.trim().toUpperCase() || undefined,
              numeroChasis: values.numeroChasis?.trim().toUpperCase() || undefined,
              color: values.color?.trim() || undefined,
              descripcionPublica: values.descripcionPublica?.trim() || undefined,
              ...(canEditInternalObservations
                ? { observacionesInternas: observacionesInternas?.trim() || undefined }
                : {}),
            };
            await vehiculoService.update(id, body);
            show("Vehículo actualizado correctamente.", "success");
            nav("/app/vehiculos");
          } catch (error) {
            show(errorMessage(error, "No pudimos actualizar el vehículo."), "error");
          }
        })}
      >
        <div className="form-grid">
          <FormField label="Marca" error={errors.marca?.message}>
            <input {...register("marca")} />
          </FormField>
          <FormField label="Modelo" error={errors.modelo?.message}>
            <input {...register("modelo")} />
          </FormField>
          <VehicleTypeField
            value={tipoVehiculo}
            currentLabel={tipoVehiculoLabel}
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
        <div className="form-actions">
          <Link className="button button--secondary" to="/app/vehiculos">
            Cancelar
          </Link>
          <button className="button" disabled={isSubmitting}>
            {isSubmitting ? "Guardando…" : "Guardar vehículo"}
          </button>
        </div>
      </form>
    </>
  );
}
