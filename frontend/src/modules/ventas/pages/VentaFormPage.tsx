import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import {
  clienteService,
  ventaService,
  vehiculoService,
} from "../../../services/api";
import type { Cliente } from "../../../types/domain.types";
import type { Vehiculo } from "../../../types/vehiculo.types";
import { FormField } from "../../../shared/forms/FormField";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { useToast } from "../../../shared/feedback/useToast";
import { todayIso } from "../../../utils/formatDate";
import { errorMessage } from "../../../utils/errorMessage";

const financingMethods = ["FINANCIACION_BANCARIA", "FINANCIACION_PROPIA"] as const;

const schema = z
  .object({
    vehiculoId: z.number({ error: "Seleccioná un vehículo." }).int().positive("Seleccioná un vehículo."),
    clienteCompradorId: z.number({ error: "Seleccioná un cliente comprador." }).int().positive("Seleccioná un cliente comprador."),
    fechaVenta: z.string().min(10, "Seleccioná la fecha de venta."),
    precioFinal: z.number({ error: "Ingresá el precio final." }).positive("El precio final debe ser mayor que cero."),
    medioPago: z.enum(["TRANSFERENCIA", "EFECTIVO", "FINANCIACION_BANCARIA", "FINANCIACION_PROPIA", "VEHICULO_PARTE_PAGO"]),
    entidadFinanciera: z.string().trim().max(120, "La entidad financiera no puede superar los 120 caracteres.").optional(),
    montoFinanciado: z.number({ error: "Ingresá un monto financiado válido." }).positive("El monto financiado debe ser mayor que cero.").optional(),
    estadoFinanciacion: z.enum(["PENDIENTE", "APROBADA", "RECHAZADA", "PAGADA"]).optional(),
    canalOrigen: z.enum(["WHATSAPP", "INSTAGRAM", "FACEBOOK", "SITIO_WEB", "REFERIDO", "PRESENCIAL", "OTRO"]),
    datosCompradorVerificados: z.boolean().refine(Boolean, "Verificá los datos del comprador."),
    documentacionRevisada: z.boolean().refine(Boolean, "Confirmá la revisión de la documentación."),
    cobroConfirmado: z.boolean().refine(Boolean, "Confirmá el cobro antes de cerrar la venta."),
    proximoMantenimiento: z.string().optional(),
    observaciones: z.string().trim().max(1000, "Las observaciones no pueden superar los 1000 caracteres.").optional(),
  })
  .superRefine((values, ctx) => {
    const financing = financingMethods.includes(values.medioPago as (typeof financingMethods)[number]);
    if (!financing) return;

    if (!values.entidadFinanciera?.trim()) {
      ctx.addIssue({ code: "custom", path: ["entidadFinanciera"], message: "Ingresá la entidad financiera." });
    }
    if (values.montoFinanciado == null) {
      ctx.addIssue({ code: "custom", path: ["montoFinanciado"], message: "Ingresá el monto financiado." });
    } else if (values.montoFinanciado > values.precioFinal) {
      ctx.addIssue({ code: "custom", path: ["montoFinanciado"], message: "El monto financiado no puede superar el precio final." });
    }
    if (!values.estadoFinanciacion) {
      ctx.addIssue({ code: "custom", path: ["estadoFinanciacion"], message: "Seleccioná el estado de la financiación." });
    }
  });

type Values = z.infer<typeof schema>;

export default function VentaFormPage() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const { show } = useToast();
  const [vehicles, setVehicles] = useState<Vehiculo[]>([]);
  const [clients, setClients] = useState<Cliente[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      fechaVenta: todayIso(),
      medioPago: "TRANSFERENCIA",
      estadoFinanciacion: "PENDIENTE",
      canalOrigen: "PRESENCIAL",
      datosCompradorVerificados: false,
      documentacionRevisada: false,
      cobroConfirmado: false,
      proximoMantenimiento: "",
      observaciones: "",
    },
  });

  const medioPago = useWatch({ control, name: "medioPago" });
  const financing = medioPago === "FINANCIACION_BANCARIA" || medioPago === "FINANCIACION_PROPIA";

  useEffect(() => {
    Promise.all([vehiculoService.list(), clienteService.list()])
      .then(([v, c]) => {
        const availableVehicles = v.filter((x) => x.activo && x.estado === "DISPONIBLE");
        setVehicles(availableVehicles);

        const requestedVehicleId = Number(searchParams.get("vehiculoId"));
        if (
          Number.isSafeInteger(requestedVehicleId) &&
          requestedVehicleId > 0 &&
          availableVehicles.some((vehicle) => vehicle.id === requestedVehicleId)
        ) {
          setValue("vehiculoId", requestedVehicleId, { shouldValidate: true });
        }

        setClients(
          c.filter(
            (x) => x.activo && (x.tipoCliente === "COMPRADOR" || x.tipoCliente === "AMBOS"),
          ),
        );
      })
      .catch((e) => show(errorMessage(e, "No pudimos cargar los datos necesarios para registrar la venta."), "error"));
  }, [searchParams, setValue, show]);

  return (
    <>
      <PageHeader
        title="Registrar venta"
        description="Solo se ofrecen unidades en estado Disponible. El vendedor responsable se toma automáticamente de la sesión autenticada."
      />
      <form
        className="card"
        onSubmit={handleSubmit(async (values) => {
          try {
            const financingSelected = values.medioPago === "FINANCIACION_BANCARIA" || values.medioPago === "FINANCIACION_PROPIA";
            const sale = await ventaService.create({
              vehiculoId: values.vehiculoId,
              clienteCompradorId: values.clienteCompradorId,
              fechaVenta: values.fechaVenta,
              precioFinal: values.precioFinal,
              medioPago: values.medioPago,
              canalOrigen: values.canalOrigen,
              datosCompradorVerificados: values.datosCompradorVerificados,
              documentacionRevisada: values.documentacionRevisada,
              cobroConfirmado: values.cobroConfirmado,
              proximoMantenimiento: values.proximoMantenimiento || undefined,
              ...(financingSelected
                ? {
                    entidadFinanciera: values.entidadFinanciera?.trim(),
                    montoFinanciado: values.montoFinanciado,
                    estadoFinanciacion: values.estadoFinanciacion,
                  }
                : {}),
              observaciones: values.observaciones?.trim() || undefined,
            });
            show("Venta registrada correctamente. El vehículo quedó marcado como vendido.", "success");
            nav(`/app/ventas/${sale.id}`);
          } catch (e) {
            show(errorMessage(e, "No pudimos registrar la venta."), "error");
          }
        })}
      >
        <div className="form-grid">
          <FormField label="Vehículo" error={errors.vehiculoId?.message}>
            <select {...register("vehiculoId", { valueAsNumber: true })}>
              <option value="">Seleccionar…</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.marca} {v.modelo} · {v.matricula || "Sin matrícula"}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Cliente comprador" error={errors.clienteCompradorId?.message}>
            <select {...register("clienteCompradorId", { valueAsNumber: true })}>
              <option value="">Seleccionar…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.razonSocial || `${c.nombre} ${c.apellido ?? ""}`} · {c.documento}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Fecha" error={errors.fechaVenta?.message}>
            <input type="date" max={todayIso()} {...register("fechaVenta")} />
          </FormField>
          <FormField label="Precio final" error={errors.precioFinal?.message}>
            <input type="number" min="1" step="1" {...register("precioFinal", { valueAsNumber: true })} />
          </FormField>
          <FormField label="Medio de pago" error={errors.medioPago?.message}>
            <select {...register("medioPago")}>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="EFECTIVO">Efectivo</option>
              <option value="FINANCIACION_BANCARIA">Financiación bancaria</option>
              <option value="FINANCIACION_PROPIA">Financiación propia</option>
              <option value="VEHICULO_PARTE_PAGO">Vehículo como parte de pago</option>
            </select>
          </FormField>
          <FormField label="Origen del contacto" error={errors.canalOrigen?.message}>
            <select {...register("canalOrigen")}>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="FACEBOOK">Facebook</option>
              <option value="SITIO_WEB">Sitio web</option>
              <option value="REFERIDO">Referido</option>
              <option value="PRESENCIAL">Presencial</option>
              <option value="OTRO">Otro</option>
            </select>
          </FormField>
          {financing && (
            <>
              <FormField label="Entidad financiera" error={errors.entidadFinanciera?.message}>
                <input {...register("entidadFinanciera")} />
              </FormField>
              <FormField label="Monto financiado" error={errors.montoFinanciado?.message}>
                <input
                  type="number"
                  min="1"
                  step="1"
                  {...register("montoFinanciado", {
                    setValueAs: (value) => (value === "" ? undefined : Number(value)),
                  })}
                />
              </FormField>
              <FormField label="Estado de financiación" error={errors.estadoFinanciacion?.message}>
                <select {...register("estadoFinanciacion")}>
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="APROBADA">Aprobada</option>
                  <option value="RECHAZADA">Rechazada</option>
                  <option value="PAGADA">Pagada</option>
                </select>
              </FormField>
            </>
          )}
          <FormField label="Próximo mantenimiento (opcional)" error={errors.proximoMantenimiento?.message}>
            <input type="date" min={todayIso()} {...register("proximoMantenimiento")} />
          </FormField>
          <FormField label="Observaciones" error={errors.observaciones?.message}>
            <textarea {...register("observaciones")} />
          </FormField>
        </div>

        <section className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h2 className="m-0 text-base font-extrabold text-slate-900">Checklist previo a confirmar la venta</h2>
          <p className="muted mt-1">Los tres controles son obligatorios para registrar la operación.</p>
          <div className="mt-4 grid gap-3">
            <label className="flex items-start gap-3 text-sm font-semibold text-slate-800">
              <input className="mt-1 accent-brand" type="checkbox" {...register("datosCompradorVerificados")} />
              Datos del comprador verificados
            </label>
            {errors.datosCompradorVerificados?.message && <small className="text-red-700">{errors.datosCompradorVerificados.message}</small>}
            <label className="flex items-start gap-3 text-sm font-semibold text-slate-800">
              <input className="mt-1 accent-brand" type="checkbox" {...register("documentacionRevisada")} />
              Documentación revisada
            </label>
            {errors.documentacionRevisada?.message && <small className="text-red-700">{errors.documentacionRevisada.message}</small>}
            <label className="flex items-start gap-3 text-sm font-semibold text-slate-800">
              <input className="mt-1 accent-brand" type="checkbox" {...register("cobroConfirmado")} />
              Cobro confirmado
            </label>
            {errors.cobroConfirmado?.message && <small className="text-red-700">{errors.cobroConfirmado.message}</small>}
          </div>
        </section>
        <div className="form-actions">
          <Link className="button button--secondary" to="/app/ventas">
            Cancelar
          </Link>
          <button className="button" disabled={isSubmitting}>
            {isSubmitting ? "Registrando…" : "Cerrar venta"}
          </button>
        </div>
      </form>
    </>
  );
}
