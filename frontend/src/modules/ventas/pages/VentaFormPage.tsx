import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
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

const schema = z.object({
  vehiculoId: z.number().int().positive(),
  clienteCompradorId: z.number().int().positive(),
  fechaVenta: z.string().min(10),
  precioFinal: z.number().positive("Debe ser mayor que cero"),
  observaciones: z.string().trim().max(1000).optional(),
});

type Values = z.infer<typeof schema>;

export default function VentaFormPage() {
  const nav = useNavigate();
  const { show } = useToast();
  const [vehicles, setVehicles] = useState<Vehiculo[]>([]);
  const [clients, setClients] = useState<Cliente[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { fechaVenta: todayIso(), observaciones: "" },
  });

  useEffect(() => {
    Promise.all([vehiculoService.list(), clienteService.list()])
      .then(([v, c]) => {
        setVehicles(
          v.filter(
            (x) =>
              x.activo &&
              (x.estado === "DISPONIBLE" || x.estado === "RESERVADO"),
          ),
        );
        setClients(
          c.filter(
            (x) =>
              x.activo &&
              (x.tipoCliente === "COMPRADOR" || x.tipoCliente === "AMBOS"),
          ),
        );
      })
      .catch((e) => show(errorMessage(e), "error"));
  }, [show]);
  
  return (
    <>
      <PageHeader
        title="Registrar venta"
        description="Solo se ofrecen unidades disponibles o reservadas. El backend valida compra previa, tareas abiertas y coherencia de fechas."
      />
      <form
        className="card"
        onSubmit={handleSubmit(async (v) => {
          try {
            const sale = await ventaService.create(v);
            show("Venta registrada y vehículo cerrado.", "success");
            nav(`/app/ventas/${sale.id}`);
          } catch (e) {
            show(errorMessage(e), "error");
          }
        })}
      >
        <div className="form-grid">
          <FormField label="Vehículo" error={errors.vehiculoId?.message}>
            <select {...register("vehiculoId", { valueAsNumber: true })}>
              <option value="">Seleccionar…</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.marca} {v.modelo} · {v.matricula}
                </option>
              ))}
            </select>
          </FormField>
          <FormField
            label="Cliente comprador"
            error={errors.clienteCompradorId?.message}
          >
            <select
              {...register("clienteCompradorId", { valueAsNumber: true })}
            >
              <option value="">Seleccionar…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.razonSocial || `${c.nombre} ${c.apellido ?? ""}`} ·{" "}
                  {c.documento}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Fecha" error={errors.fechaVenta?.message}>
            <input type="date" max={todayIso()} {...register("fechaVenta")} />
          </FormField>
          <FormField label="Precio final" error={errors.precioFinal?.message}>
            <input
              type="number"
              min="1"
              step="1"
              {...register("precioFinal", { valueAsNumber: true })}
            />
          </FormField>
          <FormField label="Observaciones">
            <textarea {...register("observaciones")} />
          </FormField>
        </div>
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
