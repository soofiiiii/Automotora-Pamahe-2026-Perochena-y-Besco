import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { vehiculoService } from "../../../services/api";
import { INTERNAL_OBSERVATIONS_ROLES, hasAnyRole } from "../../../config/permissions";
import { useAuth } from "../../../hooks/useAuth";
import { FormField } from "../../../shared/forms/FormField";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { useToast } from "../../../shared/feedback/useToast";
import { errorMessage } from "../../../utils/errorMessage";

const currentYear = new Date().getFullYear() + 1;

const schema = z.object({
  marca: z.string().trim().min(2, "Obligatorio").max(80),
  modelo: z.string().trim().min(1, "Obligatorio").max(80),
  anio: z.number().int().min(1950).max(currentYear),
  matricula: z.string().trim().min(3).max(20),
  numeroChasis: z.string().trim().max(60).optional(),
  color: z.string().trim().max(50).optional(),
  kilometraje: z.number().int().min(0).optional(),
  precioVentaEstimado: z.number().positive().optional(),
  descripcionPublica: z.string().trim().max(1000).optional(),
  observacionesInternas: z.string().trim().max(1000).optional(),
});

type Values = z.infer<typeof schema>;

export default function VehiculoFormPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { show } = useToast();
  const { session } = useAuth();
  const canEditInternalObservations = hasAnyRole(
    session?.roles ?? [],
    INTERNAL_OBSERVATIONS_ROLES,
  );
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      marca: "",
      modelo: "",
      anio: new Date().getFullYear(),
      matricula: "",
      numeroChasis: "",
      color: "",
      kilometraje: 0,
      descripcionPublica: "",
      observacionesInternas: "",
    },
  });

  useEffect(() => {
    if (id)
      vehiculoService
        .get(Number(id))
        .then((v) =>
          reset({
            marca: v.marca,
            modelo: v.modelo,
            anio: v.anio,
            matricula: v.matricula,
            numeroChasis: v.numeroChasis ?? "",
            color: v.color ?? "",
            kilometraje: v.kilometraje ?? 0,
            precioVentaEstimado: v.precioVentaEstimado ?? undefined,
            descripcionPublica: v.descripcionPublica ?? "",
            observacionesInternas: v.observacionesInternas ?? "",
          }),
        )
        .catch((e) => show(errorMessage(e), "error"));
  }, [id, reset, show]);

  return (
    <>
      <PageHeader
        title={id ? "Editar vehículo" : "Nuevo vehículo"}
        description="El costo de compra no se carga aquí: se establece al registrar la compra, manteniendo un único origen para ese dato."
      />
      <form
        className="card"
        onSubmit={handleSubmit(async (v) => {
          try {
            const { observacionesInternas, ...vehicleValues } = v;
            const body = {
              ...vehicleValues,
              marca: v.marca.trim(),
              modelo: v.modelo.trim(),
              matricula: v.matricula.trim().toUpperCase(),
              numeroChasis: v.numeroChasis?.trim().toUpperCase() || undefined,
              color: v.color?.trim() || undefined,
              descripcionPublica: v.descripcionPublica?.trim() || undefined,
              ...(canEditInternalObservations
                ? {
                    observacionesInternas:
                      observacionesInternas?.trim() || undefined,
                  }
                : {}),
            };
            if (id) await vehiculoService.update(Number(id), body);
            else await vehiculoService.create(body);
            show("Vehículo guardado.", "success");
            nav("/app/vehiculos");
          } catch (e) {
            show(errorMessage(e), "error");
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
          <FormField label="Año" error={errors.anio?.message}>
            <input
              type="number"
              {...register("anio", { valueAsNumber: true })}
            />
          </FormField>
          <FormField label="Matrícula" error={errors.matricula?.message}>
            <input autoCapitalize="characters" {...register("matricula")} />
          </FormField>
          <FormField label="Número de chasis">
            <input autoCapitalize="characters" {...register("numeroChasis")} />
          </FormField>
          <FormField label="Color">
            <input {...register("color")} />
          </FormField>
          <FormField label="Kilometraje" error={errors.kilometraje?.message}>
            <input
              type="number"
              min="0"
              {...register("kilometraje", {
                setValueAs: (v) => (v === "" ? undefined : Number(v)),
              })}
            />
          </FormField>
          <FormField
            label="Precio de venta estimado"
            error={errors.precioVentaEstimado?.message}
          >
            <input
              type="number"
              min="0"
              step="1"
              {...register("precioVentaEstimado", {
                setValueAs: (v) => (v === "" ? undefined : Number(v)),
              })}
            />
          </FormField>
          <FormField label="Descripción pública">
            <textarea {...register("descripcionPublica")} />
          </FormField>
          {canEditInternalObservations && (
            <FormField label="Observaciones internas">
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
