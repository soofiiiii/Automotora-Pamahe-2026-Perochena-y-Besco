import { ArrowLeft, Pencil } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  COMMERCIAL_ROLES,
  MANAGEMENT_ROLES,
  WORKSHOP_ROLES,
  hasAnyRole,
} from "../../../config/permissions";
import { useAuth } from "../../../hooks/useAuth";
import {
  costoService,
  tallerService,
  vehiculoService,
} from "../../../services/api";
import type { CostosVehiculo, Refaccion } from "../../../types/domain.types";
import type { EstadoVehiculo, Vehiculo } from "../../../types/vehiculo.types";
import { LoadingState } from "../../../shared/feedback/LoadingState";
import { ErrorState } from "../../../shared/feedback/ErrorState";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { StatusBadge } from "../../../shared/ui/StatusBadge";
import { useToast } from "../../../shared/feedback/useToast";
import { formatCurrency } from "../../../utils/formatCurrency";
import { formatDate } from "../../../utils/formatDate";
import { errorMessage } from "../../../utils/errorMessage";
import VehicleImages from "../components/VehicleImages";

const globalTransitions: Record<EstadoVehiculo, EstadoVehiculo[]> = {
  COMPRADO: ["EN_TALLER", "DISPONIBLE", "DADO_DE_BAJA"],
  EN_TALLER: ["DISPONIBLE", "DADO_DE_BAJA"],
  DISPONIBLE: ["RESERVADO", "EN_TALLER", "DADO_DE_BAJA"],
  RESERVADO: ["DISPONIBLE"],
  VENDIDO: [],
  DADO_DE_BAJA: [],
};

export default function VehiculoDetailPage() {
  const id = Number(useParams().id);
  const validId = Number.isInteger(id) && id > 0;

  const { session } = useAuth();

  const roles = useMemo(() => session?.roles ?? [], [session?.roles]);

  const management = hasAnyRole(roles, MANAGEMENT_ROLES);
  const commercial = hasAnyRole(roles, COMMERCIAL_ROLES);
  const workshop = hasAnyRole(roles, WORKSHOP_ROLES);

  const [vehicle, setVehicle] = useState<Vehiculo | null>(null);
  const [costs, setCosts] = useState<CostosVehiculo | null>(null);
  const [repairs, setRepairs] = useState<Refaccion[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const { show } = useToast();

  const load = async () => {
    if (!validId) return;

    setLoading(true);
    setLoadError("");

    try {
      const vehicleData = await vehiculoService.get(id);
      setVehicle(vehicleData);

      if (management) {
        costoService
          .get(id)
          .then(setCosts)
          .catch(() => setCosts(null));
      }

      if (workshop) {
        tallerService
          .byVehicle(id)
          .then(setRepairs)
          .catch(() => setRepairs([]));
      }
    } catch (e) {
      setLoadError(errorMessage(e));
      setVehicle(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!validId) return;

    let cancelled = false;

    vehiculoService
      .get(id)
      .then((data) => {
        if (!cancelled) {
          setVehicle(data);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(errorMessage(error));
          setVehicle(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, validId]);

  useEffect(() => {
    if (!validId || !management) return;

    let cancelled = false;

    costoService
      .get(id)
      .then((data) => {
        if (!cancelled) {
          setCosts(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCosts(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, validId, management]);

  useEffect(() => {
    if (!validId || !workshop) return;

    let cancelled = false;

    tallerService
      .byVehicle(id)
      .then((data) => {
        if (!cancelled) {
          setRepairs(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRepairs([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, validId, workshop]);

  const allowed = useMemo(() => {
    if (!vehicle) return [] as EstadoVehiculo[];

    if (management) {
      return globalTransitions[vehicle.estado];
    }

    if (hasAnyRole(roles, ["VENDEDOR"])) {
      const map: Partial<Record<EstadoVehiculo, EstadoVehiculo[]>> = {
        COMPRADO: ["DISPONIBLE"],
        DISPONIBLE: ["RESERVADO", "EN_TALLER"],
        RESERVADO: ["DISPONIBLE"],
      };

      return map[vehicle.estado] ?? [];
    }

    if (hasAnyRole(roles, ["TALLER"])) {
      const map: Partial<Record<EstadoVehiculo, EstadoVehiculo[]>> = {
        COMPRADO: ["EN_TALLER"],
        EN_TALLER: ["DISPONIBLE"],
        DISPONIBLE: ["EN_TALLER"],
      };

      return map[vehicle.estado] ?? [];
    }

    return [];
  }, [vehicle, management, roles]);

  if (loading) return <LoadingState label="Cargando vehículo…" />;
  if (loadError || !vehicle)
    return (
      <ErrorState
        title="No pudimos abrir el vehículo"
        description={loadError || "El vehículo no está disponible."}
        onRetry={() => void load()}
      />
    );

  const changeState = async (state: EstadoVehiculo) => {
    setBusy(true);
    try {
      setVehicle(await vehiculoService.state(id, state));
      show("Estado actualizado.", "success");
    } catch (e) {
      show(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title={`${vehicle.marca} ${vehicle.modelo}`}
        description={`${vehicle.anio} · ${vehicle.matricula}`}
        actions={
          <>
            <Link className="button button--secondary" to="/app/vehiculos">
              <ArrowLeft size={17} />
              Volver
            </Link>
            {commercial && (
              <Link className="button" to={`/app/vehiculos/${id}/editar`}>
                <Pencil size={17} />
                Editar
              </Link>
            )}
          </>
        }
      />
      <div className="split">
        <div className="grid">
          <section className="card">
            <div className="section-title">
              <h2>Datos generales</h2>
              <StatusBadge value={vehicle.estado} />
            </div>
            <div className="detail-list">
              <Detail label="Color" value={vehicle.color} />
              <Detail
                label="Kilometraje"
                value={
                  vehicle.kilometraje
                    ? `${Intl.NumberFormat("es-UY").format(vehicle.kilometraje)} km`
                    : "—"
                }
              />
              <Detail label="Chasis" value={vehicle.numeroChasis} />
              {commercial && (
                <Detail
                  label="Precio estimado"
                  value={formatCurrency(vehicle.precioVentaEstimado)}
                />
              )}
              <Detail
                label="Catálogo"
                value={vehicle.publicado ? "Publicado" : "No publicado"}
              />
              <Detail label="Activo" value={vehicle.activo ? "Sí" : "No"} />
            </div>
            {vehicle.descripcionPublica && (
              <div style={{ marginTop: 16 }}>
                <strong>Descripción pública</strong>
                <p className="muted">{vehicle.descripcionPublica}</p>
              </div>
            )}
            {management && vehicle.observacionesInternas && (
              <div>
                <strong>Observaciones internas</strong>
                <p className="muted">{vehicle.observacionesInternas}</p>
              </div>
            )}
          </section>
          <VehicleImages vehicleId={id} />
          {workshop && (
            <section className="card">
              <h2>Trabajos de taller</h2>
              {repairs.length ? (
                repairs.slice(0, 8).map((r) => (
                  <div className="timeline-row" key={r.id}>
                    <StatusBadge value={r.estadoTarea} />
                    <div>
                      <strong>{r.tipoTrabajo}</strong>
                      <p>{r.descripcion}</p>
                      <small>{formatDate(r.fecha)}</small>
                    </div>
                  </div>
                ))
              ) : (
                <p className="muted">
                  No hay refacciones registradas para esta unidad.
                </p>
              )}
            </section>
          )}
        </div>
        <aside className="grid">
          <section className="card">
            <h2>Cambiar estado</h2>
            <p className="muted">
              Solo se muestran transiciones generales; el backend valida además
              el rol y las reglas de negocio.
            </p>
            <div className="grid">
              {allowed
                .filter((s) => !(s === "DADO_DE_BAJA" && !management))
                .map((s) => (
                  <button
                    className="button button--secondary"
                    disabled={busy}
                    type="button"
                    onClick={() => changeState(s)}
                    key={s}
                  >
                    {s.replaceAll("_", " ")}
                  </button>
                ))}
              {!allowed.length && (
                <p className="muted">
                  No hay transiciones manuales disponibles.
                </p>
              )}
            </div>
          </section>
          {commercial && vehicle.estado === "DISPONIBLE" && (
            <section className="card">
              <h2>Publicación</h2>
              <p className="muted">
                La publicación pública depende también de las validaciones del
                backend.
              </p>
              <button
                className="button button--accent"
                type="button"
                onClick={async () => {
                  setBusy(true);
                  try {
                    setVehicle(
                      await vehiculoService.publication(id, !vehicle.publicado),
                    );
                    show("Publicación actualizada.", "success");
                  } catch (e) {
                    show(errorMessage(e), "error");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {vehicle.publicado
                  ? "Retirar del catálogo"
                  : "Publicar en catálogo"}
              </button>
            </section>
          )}
          {management && vehicle.activo && vehicle.estado !== "VENDIDO" && (
            <section className="card">
              <h2>Administración</h2>
              <p className="muted">
                La baja es lógica y conserva el historial.
              </p>
              <button
                className="button button--danger"
                type="button"
                onClick={async () => {
                  if (!confirm("¿Dar de baja este vehículo?")) return;
                  try {
                    await vehiculoService.deactivate(id);
                    show("Vehículo desactivado.", "success");
                    setVehicle({ ...vehicle, activo: false });
                  } catch (e) {
                    show(errorMessage(e), "error");
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
              {costs ? (
                <div className="grid">
                  <Detail
                    label="Costo compra"
                    value={formatCurrency(Number(costs.costoCompra ?? 0))}
                  />
                  <Detail
                    label="Refacciones"
                    value={formatCurrency(Number(costs.costoRefacciones ?? 0))}
                  />
                  <Detail
                    label="Costo total"
                    value={formatCurrency(Number(costs.costoTotal ?? 0))}
                  />
                  {costs.rentabilidad !== undefined && (
                    <Detail
                      label="Rentabilidad"
                      value={formatCurrency(Number(costs.rentabilidad ?? 0))}
                    />
                  )}
                </div>
              ) : (
                <p className="muted">
                  El backend todavía no devolvió un resumen económico para esta
                  unidad.
                </p>
              )}
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
function Detail({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="detail-item">
      <small>{label}</small>
      <strong>
        {value === null || value === undefined || value === ""
          ? "—"
          : String(value)}
      </strong>
    </div>
  );
}
