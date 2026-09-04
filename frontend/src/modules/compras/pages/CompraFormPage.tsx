import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import {
  clienteService,
  compraService,
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
  clienteVendedorId: z.number().int().positive(),
  fechaCompra: z.string().min(10),
  costoAdquisicion: z.number().positive("Debe ser mayor que cero"),
  observaciones: z.string().trim().max(1000).optional(),
});

type Values = z.infer<typeof schema>;

export default function CompraFormPage() {
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
    defaultValues: { fechaCompra: todayIso(), observaciones: "" },
  });

  useEffect(() => {
    Promise.all([vehiculoService.list(), clienteService.list()])
      .then(([v, c]) => {
        setVehicles(v.filter((x) => x.estado === "COMPRADO" && x.activo));
        setClients(
          c.filter(
            (x) =>
              x.activo &&
              (x.tipoCliente === "VENDEDOR" || x.tipoCliente === "AMBOS"),
          ),
        );
      })
      .catch((e) => show(errorMessage(e), "error"));
  }, [show]);
  
  return (
    <>
      <PageHeader
        title="Registrar compra"
        description="La operación fija el costo inicial del vehículo. El backend evita compras duplicadas y valida que la unidad siga en estado COMPRADO."
      />
      <form
        className="card"
        onSubmit={handleSubmit(async (v) => {
          try {
            await compraService.create(v);
            show("Compra registrada.", "success");
            nav("/app/compras");
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
            label="Cliente vendedor"
            error={errors.clienteVendedorId?.message}
          >
            <select {...register("clienteVendedorId", { valueAsNumber: true })}>
              <option value="">Seleccionar…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.razonSocial || `${c.nombre} ${c.apellido ?? ""}`} ·{" "}
                  {c.documento}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Fecha" error={errors.fechaCompra?.message}>
            <input type="date" max={todayIso()} {...register("fechaCompra")} />
          </FormField>
          <FormField
            label="Costo de adquisición"
            error={errors.costoAdquisicion?.message}
          >
            <input
              type="number"
              min="1"
              step="1"
              {...register("costoAdquisicion", { valueAsNumber: true })}
            />
          </FormField>
          <FormField label="Observaciones">
            <textarea {...register("observaciones")} />
          </FormField>
        </div>
        <div className="form-actions">
          <Link className="button button--secondary" to="/app/compras">
            Cancelar
          </Link>
          <button className="button" disabled={isSubmitting}>
            {isSubmitting ? "Registrando…" : "Registrar compra"}
          </button>
        </div>
      </form>
    </>
  );
}
