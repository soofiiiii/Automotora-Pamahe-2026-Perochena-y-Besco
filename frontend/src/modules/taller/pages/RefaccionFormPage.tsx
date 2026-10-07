import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { z } from "zod";
import { useOnlineStatus } from "../../../hooks/useOnlineStatus";
import { tallerOfflineService } from "../../../offline/tallerOfflineService";
import { tallerService, vehiculoService } from "../../../services/api";
import { useAuth } from "../../../hooks/useAuth";
import { API_URL } from "../../../config/apiConfig";
import { syncQueue } from "../../../offline/syncQueue";
import { vehicleCache } from "../../../offline/vehicleCache";
import { evidenceUrl } from "../../../utils/evidenceUrl";
import { RepairEvidence } from "../components/RepairEvidence";
import { LoadingState } from "../../../shared/feedback/LoadingState";
import { ErrorState } from "../../../shared/feedback/ErrorState";
import type { Refaccion, TipoTrabajo } from "../../../types/domain.types";
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
  vehiculoId: z.number({ error: "Seleccioná un vehículo." }).int("Seleccioná un vehículo válido.").positive("Seleccioná un vehículo."),
  responsableOperativoId: z.number({ error: "Seleccioná un responsable válido." }).int("Seleccioná un responsable válido.").positive("Seleccioná un responsable válido.").optional(),
  fecha: z.string().min(10, "Seleccioná la fecha del trabajo."),
  tipoTrabajo: z.enum(workTypes),
  descripcion: z.string().trim().min(3, "Describí brevemente el trabajo realizado.").max(500, "La descripción no puede superar los 500 caracteres."),
  costoRepuestos: z.number({ error: "Ingresá un costo de repuestos válido." }).min(0, "El costo de repuestos no puede ser negativo."),
  costoManoObra: z.number({ error: "Ingresá un costo de mano de obra válido." }).min(0, "El costo de mano de obra no puede ser negativo."),
  costoServiciosExternos: z.number({ error: "Ingresá un costo de servicios externos válido." }).min(0, "El costo de servicios externos no puede ser negativo."),
  estadoTarea: z.enum(["PENDIENTE", "EN_CURSO", "FINALIZADA", "CANCELADA"]),
  observaciones: z.string().trim().max(1000, "Las observaciones no pueden superar los 1000 caracteres.").optional(),
  registroFotograficoUrl: z
    .string()
    .trim()
    .max(500)
    .refine(
      (value) => !value || Boolean(evidenceUrl(value)),
      "Usá una URL http/https o una ruta de imagen de la aplicación.",
    )
    .optional(),
});

type Values = z.infer<typeof schema>;

export default function RefaccionFormPage() {
  const id = useParams().id;
  if (id && (!Number.isSafeInteger(Number(id)) || Number(id) <= 0))
    return (
      <ErrorState description="El enlace de la refacción no es válido." />
    );
  return <RepairForm key={id ?? "new"} id={id} />;
}

function RepairForm({ id }: { id?: string }) {
  const online = useOnlineStatus();
  const nav = useNavigate();
  const { show } = useToast();
  const [vehicles, setVehicles] = useState<Vehiculo[]>([]);
  const [repair, setRepair] = useState<Refaccion>();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [cachedAt, setCachedAt] = useState("");
  const [operationId] = useState(() => crypto.randomUUID());
  const { session } = useAuth();
  const username = session?.username ?? "";
  const [params] = useSearchParams();
  const relatedId = Number(params.get("vehiculoId"));
  const relatedVehicle =
    Number.isSafeInteger(relatedId) && relatedId > 0 ? relatedId : undefined;

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
    const controller = new AbortController();
    const load = async () => {
      try {
        let available: Vehiculo[];
        try {
          if (!navigator.onLine) throw new Error("Sin conexión");
          available = await vehiculoService.list(undefined, controller.signal);
          await vehicleCache.save(username, available);
        } catch (cause) {
          if (controller.signal.aborted) return;
          if (axios.isAxiosError(cause) && cause.response) throw cause;
          const cached = await vehicleCache.get(username);
          if (!cached)
            throw new Error(
              "Todavía no hay vehículos guardados en este dispositivo. Conectate a internet y abrí este formulario una vez antes de registrar trabajos sin conexión.",
              { cause },
            );
          available = cached.rows;
          if (!controller.signal.aborted) setCachedAt(cached.updatedAt);
        }
        if (controller.signal.aborted) return;
        setVehicles(
          available.filter(
            (vehicle) =>
              vehicle.activo &&
              !["VENDIDO", "DADO_DE_BAJA"].includes(vehicle.estado),
          ),
        );
        if (id) {
          const current = await tallerService.get(
            Number(id),
            relatedVehicle,
            controller.signal,
          );
          if (controller.signal.aborted) return;
          setRepair(current);
          reset({
            vehiculoId: current.vehiculoId,
            responsableOperativoId: current.responsableOperativoId ?? undefined,
            fecha: current.fecha,
            tipoTrabajo: current.tipoTrabajo,
            descripcion: current.descripcion,
            costoRepuestos: current.costoRepuestos,
            costoManoObra: current.costoManoObra,
            costoServiciosExternos: current.costoServiciosExternos,
            estadoTarea: current.estadoTarea,
            observaciones: current.observaciones ?? "",
            registroFotograficoUrl: current.registroFotograficoUrl ?? "",
          });
        }
      } catch (cause) {
        if (!controller.signal.aborted) setLoadError(errorMessage(cause, "No pudimos cargar los datos del taller."));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [id, relatedVehicle, reset, username]);

  const vehiculoId = useWatch({
    control,
    name: "vehiculoId",
  });

  if (loading) return <LoadingState label="Cargando datos del taller…" />;
  if (loadError)
    return (
      <>
        <ErrorState description={loadError} />
        <Link className="button button--secondary" to="/app/taller">
          Volver al taller
        </Link>
      </>
    );

  return (
    <>
      <PageHeader
        title={id ? "Editar refacción" : "Nueva refacción"}
        description="Registrá el trabajo, sus costos y la referencia fotográfica. Los trabajos nuevos quedan guardados en este dispositivo hasta recibir confirmación."
      />
      {cachedAt && (
        <p className="notice notice--warning">
          Se utiliza la lista de vehículos guardada el{" "}
          {new Date(cachedAt).toLocaleString("es-UY")}. El estado del vehículo
          se verificará al enviar.
        </p>
      )}
      {repair && (
        <section className="card">
          <div className="detail-list">
            <div className="detail-item">
              <small>Responsable operativo</small>
              <strong>{repair.responsableOperativo || "Sin asignar"}</strong>
            </div>
            <div className="detail-item">
              <small>Registrado por</small>
              <strong>{repair.usuarioQueRegistra || "No informado"}</strong>
            </div>
          </div>
          <RepairEvidence value={repair.registroFotograficoUrl} />
        </section>
      )}
      {!online && !id && (
        <div className="offline-form-hint">
          <WifiOff />
          Se guardará en este dispositivo y se enviará cuando vuelva la
          conexión.
        </div>
      )}
      <form
        className="card workshop-form"
        onSubmit={handleSubmit(async (values) => {
          if (id) {
            if (!online) {
              show(
                "Para editar una tarea ya registrada necesitás conexión.",
                "error",
              );
              return;
            }
            try {
              const { vehiculoId: vehicle, ...update } = values;
              await tallerService.update(Number(id), update);
              show("Refacción actualizada correctamente.", "success");
              nav(`/app/taller/${id}?vehiculoId=${vehicle}`);
            } catch (cause) {
              show(errorMessage(cause, id ? "No pudimos actualizar la refacción." : "No pudimos guardar la refacción."), "error");
            }
            return;
          }
          try {
            await tallerOfflineService.save({
              ...values,
              idOperacionOffline: operationId,
            });
          } catch (cause) {
            show(errorMessage(cause, id ? "No pudimos actualizar la refacción." : "No pudimos guardar la refacción."), "error");
            return;
          }
          try {
            if (navigator.onLine) await tallerOfflineService.sync();
            const stored = (await syncQueue.list(username, API_URL)).find(
              (row) => row.id === operationId,
            );
            show(
              stored?.status === "synced"
                ? "Refacción registrada correctamente."
                : "Refacción guardada en este dispositivo. Podés revisar su envío en Operaciones pendientes.",
              stored?.status === "synced" ? "success" : "info",
            );
          } catch {
            show(
              "La refacción quedó guardada en este dispositivo. Revisá su estado en Operaciones pendientes.",
              "info",
            );
          }
          nav("/app/taller/offline");
        })}
      >
        <div className="form-grid">
          <FormField label="Vehículo" error={errors.vehiculoId?.message}>
            {id ? (
              <>
                <select value={vehiculoId ?? ""} disabled>
                  <option value="">Seleccionar…</option>
                  {repair &&
                    !vehicles.some(
                      (vehicle) => vehicle.id === repair.vehiculoId,
                    ) && (
                      <option value={repair.vehiculoId}>
                        {repair.vehiculo || `Vehículo #${repair.vehiculoId}`}
                      </option>
                    )}
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
          <input
            type="hidden"
            {...register("responsableOperativoId", {
              setValueAs: (value) =>
                value === "" || value == null ? undefined : Number(value),
            })}
          />
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
            <textarea maxLength={1000} {...register("descripcion")} />
          </FormField>
          <FormField label="Observaciones" error={errors.observaciones?.message}>
            <textarea {...register("observaciones")} />
          </FormField>
        </div>
        <div className="form-actions">
          <Link className="button button--secondary" to="/app/taller">
            Cancelar
          </Link>
          <button
            className="button button--accent"
            disabled={isSubmitting || (!id && !vehicles.length)}
          >
            {isSubmitting
              ? "Guardando…"
              : online
                ? "Guardar refacción"
                : "Guardar en el dispositivo"}
          </button>
        </div>
      </form>
    </>
  );
}