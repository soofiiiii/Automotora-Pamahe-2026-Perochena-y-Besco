import { zodResolver } from "@hookform/resolvers/zod";
import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { useOnlineStatus } from "../../../hooks/useOnlineStatus";
import { tallerOfflineService } from "../../../offline/tallerOfflineService";
import { tallerService, vehiculoService } from "../../../services/api";
import type { TipoTrabajo } from "../../../types/domain.types";
import type { Vehiculo } from "../../../types/vehiculo.types";
import { FormField } from "../../../shared/forms/FormField";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { useToast } from "../../../shared/feedback/useToast";
import { todayIso } from "../../../utils/formatDate";
import { errorMessage } from "../../../utils/errorMessage";

const workTypes = [
  "MECANICA",
  "PINTURA",
  "CARROCERIA",
  "LIMPIEZA",
  "DETAILING",
  "REPUESTO",
  "SERVICIO_EXTERNO",
  "OTRO",
] as const satisfies readonly TipoTrabajo[];

const schema = z.object({
  vehiculoId: z.number().int().positive(),
  fecha: z.string().min(10),
  tipoTrabajo: z.enum(workTypes),
  descripcion: z.string().trim().min(3, "Describí el trabajo").max(500),
  costoRepuestos: z.number().min(0),
  costoManoObra: z.number().min(0),
  costoServiciosExternos: z.number().min(0),
  estadoTarea: z.enum(["PENDIENTE", "EN_CURSO", "FINALIZADA", "CANCELADA"]),
  observaciones: z.string().trim().max(1000).optional(),
  registroFotograficoUrl: z.string().trim().max(500).optional(),
});

type Values = z.infer<typeof schema>;

export default function RefaccionFormPage() {
  const id = useParams().id;
  const online = useOnlineStatus();
  const nav = useNavigate();
  const { show } = useToast();
  const [vehicles, setVehicles] = useState<Vehiculo[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      fecha: todayIso(),
      tipoTrabajo: "MECANICA",
      descripcion: "",
      costoRepuestos: 0,
      costoManoObra: 0,
      costoServiciosExternos: 0,
      estadoTarea: "PENDIENTE",
      observaciones: "",
      registroFotograficoUrl: "",
    },
  });

  useEffect(() => {
    vehiculoService
      .list()
      .then((v) =>
        setVehicles(
          v.filter(
            (x) =>
              x.activo && x.estado !== "VENDIDO" && x.estado !== "DADO_DE_BAJA",
          ),
        ),
      )
      .catch((e) => show(errorMessage(e), "error"));
    if (id)
      tallerService
        .list()
        .then((list) => {
          const r = list.find((x) => x.id === Number(id));
          if (r)
            reset({
              vehiculoId: r.vehiculoId,
              fecha: r.fecha,
              tipoTrabajo: r.tipoTrabajo,
              descripcion: r.descripcion,
              costoRepuestos: r.costoRepuestos,
              costoManoObra: r.costoManoObra,
              costoServiciosExternos: r.costoServiciosExternos,
              estadoTarea: r.estadoTarea,
              observaciones: r.observaciones ?? "",
              registroFotograficoUrl: "",
            });
        })
        .catch((e) => show(errorMessage(e), "error"));
  }, [id, reset, show]);

  const vehiculoId = useWatch({
    control,
    name: "vehiculoId",
  });

  return (
    <>
      <PageHeader
        title={id ? "Editar refacción" : "Nueva refacción"}
        description="Los costos se separan entre repuestos, mano de obra y servicios externos. Si no hay conexión, una refacción nueva queda en IndexedDB hasta poder enviarse."
      />
      {!online && !id && (
        <div className="offline-form-hint">
          <WifiOff />
          Se guardará en este dispositivo y se enviará cuando vuelva la
          conexión.
        </div>
      )}
      <form
        className="card workshop-form"
        onSubmit={handleSubmit(async (v) => {
          try {
            if (id) {
              if (!online) {
                show(
                  "Para editar una refacción ya sincronizada necesitás conexión.",
                  "error",
                );
                return;
              }
              const { vehiculoId: _, ...update } = v;
              void _;
              await tallerService.update(Number(id), update);
            } else if (!online) {
              await tallerOfflineService.save(v);
              show("Refacción guardada en la cola offline.", "success");
            } else await tallerService.create(v);
            show(
              id ? "Refacción actualizada." : "Refacción registrada.",
              "success",
            );
            nav("/app/taller");
          } catch (e) {
            if (!id && !navigator.onLine) {
              await tallerOfflineService.save(v);
              show(
                "La conexión se perdió durante el envío. Guardamos la refacción localmente.",
                "info",
              );
              nav("/app/taller");
            } else show(errorMessage(e), "error");
          }
        })}
      >
        <div className="form-grid">
          <FormField label="Vehículo" error={errors.vehiculoId?.message}>
            {id ? (
              <>
                <select value={vehiculoId ?? ""} disabled>
                  <option value="">Seleccionar…</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.marca} {v.modelo} · {v.matricula} · {v.estado}
                    </option>
                  ))}
                </select>
                <input
                  type="hidden"
                  {...register("vehiculoId", { valueAsNumber: true })}
                />
              </>
            ) : (
              <select {...register("vehiculoId", { valueAsNumber: true })}>
                <option value="">Seleccionar…</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.marca} {v.modelo} · {v.matricula} · {v.estado}
                  </option>
                ))}
              </select>
            )}
          </FormField>
          <FormField label="Fecha" error={errors.fecha?.message}>
            <input type="date" max={todayIso()} {...register("fecha")} />
          </FormField>
          <FormField
            label="Tipo de trabajo"
            error={errors.tipoTrabajo?.message}
          >
            <select {...register("tipoTrabajo")}>
              {workTypes.map((t) => (
                <option key={t} value={t}>
                  {t.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Estado" error={errors.estadoTarea?.message}>
            <select {...register("estadoTarea")}>
              <option value="PENDIENTE">Pendiente</option>
              <option value="EN_CURSO">En curso</option>
              <option value="FINALIZADA">Finalizada</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </FormField>
          <FormField
            label="Costo de repuestos"
            error={errors.costoRepuestos?.message}
          >
            <input
              type="number"
              min="0"
              step="1"
              inputMode="decimal"
              {...register("costoRepuestos", { valueAsNumber: true })}
            />
          </FormField>
          <FormField
            label="Costo de mano de obra"
            error={errors.costoManoObra?.message}
          >
            <input
              type="number"
              min="0"
              step="1"
              inputMode="decimal"
              {...register("costoManoObra", { valueAsNumber: true })}
            />
          </FormField>
          <FormField
            label="Servicios externos"
            error={errors.costoServiciosExternos?.message}
          >
            <input
              type="number"
              min="0"
              step="1"
              inputMode="decimal"
              {...register("costoServiciosExternos", { valueAsNumber: true })}
            />
          </FormField>
          <FormField
            label="Referencia fotográfica (URL opcional)"
            error={errors.registroFotograficoUrl?.message}
          >
            <input {...register("registroFotograficoUrl")} />
          </FormField>
          <FormField label="Descripción" error={errors.descripcion?.message}>
            <textarea maxLength={500} {...register("descripcion")} />
          </FormField>
          <FormField label="Observaciones">
            <textarea {...register("observaciones")} />
          </FormField>
        </div>
        <div className="form-actions">
          <Link className="button button--secondary" to="/app/taller">
            Cancelar
          </Link>
          <button className="button button--accent" disabled={isSubmitting}>
            {isSubmitting
              ? "Guardando…"
              : online
                ? "Guardar refacción"
                : "Guardar offline"}
          </button>
        </div>
      </form>
    </>
  );
}