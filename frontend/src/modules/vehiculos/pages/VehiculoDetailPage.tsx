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
import { vehiculoService } from "../../../services/api";
import type {
  EstadoVehiculo,
  Vehiculo,
  VehiculoHistorial,
} from "../../../types/vehiculo.types";
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

interface RefaccionHistorialView {
  id: number;
  fecha: string;
  tipoTrabajo: string;
  descripcion: string;
  estadoTarea: string;
}

interface CompraHistorialView {
  fechaCompra?: string;
  clienteVendedor?: string;
}

interface VentaHistorialView {
  fechaVenta?: string;
  clienteComprador?: string;
  precioFinal?: number;
  costoCompraAlVender?: number;
  costoRefaccionesAlVender?: number;
  costoTotalAlVender?: number;
  rentabilidadCalculada?: number;
}


/* =========================================================
   COMPONENTE PRINCIPAL
   ========================================================= */

export default function VehiculoDetailPage() {
  const id = Number(useParams().id);

  const validId = Number.isInteger(id) && id > 0;

  const { session } = useAuth();

  const roles = useMemo(
    () => session?.roles ?? [],
    [session?.roles]
  );

  const management = hasAnyRole(
    roles,
    MANAGEMENT_ROLES
  );

  const commercial = hasAnyRole(
    roles,
    COMMERCIAL_ROLES
  );

  const workshop = hasAnyRole(
    roles,
    WORKSHOP_ROLES
  );


  /* =========================================================
     ESTADOS
     ========================================================= */

  const [vehicle, setVehicle] =
    useState<Vehiculo | null>(null);

  const [history, setHistory] =
    useState<VehiculoHistorial | null>(null);

  const [busy, setBusy] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState("");


  const { show } = useToast();


  /* =========================================================
     CARGAR HISTORIAL COMPLETO
     ========================================================= */

  const load = async () => {
    if (!validId) return;

    try {
      setLoading(true);
      setLoadError("");

      const data =
        await vehiculoService.historial(id);

      setHistory(data);

      /*
       * El backend devuelve versiones diferentes
       * del vehículo según el rol.
       *
       * Lo convertimos a Vehiculo para mantener
       * la compatibilidad con las acciones
       * existentes de esta pantalla.
       */
      setVehicle(data.vehiculo as Vehiculo);

    } catch (error) {
      setLoadError(
        errorMessage(error)
      );

      setHistory(null);
      setVehicle(null);

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (!validId) return;

    void load();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, validId]);


  /* =========================================================
     TRANSICIONES DE ESTADO
     ========================================================= */

  const allowed = useMemo(() => {
    if (!vehicle) {
      return [] as EstadoVehiculo[];
    }


    if (management) {
      return globalTransitions[
        vehicle.estado
      ];
    }


    if (
      hasAnyRole(
        roles,
        ["VENDEDOR"]
      )
    ) {
      const map:
        Partial<
          Record<
            EstadoVehiculo,
            EstadoVehiculo[]
          >
        > = {

        COMPRADO: [
          "DISPONIBLE"
        ],

        DISPONIBLE: [
          "RESERVADO",
          "EN_TALLER",
        ],

        RESERVADO: [
          "DISPONIBLE"
        ],
      };

      return (
        map[vehicle.estado] ?? []
      );
    }


    if (
      hasAnyRole(
        roles,
        ["TALLER"]
      )
    ) {
      const map:
        Partial<
          Record<
            EstadoVehiculo,
            EstadoVehiculo[]
          >
        > = {

        COMPRADO: [
          "EN_TALLER"
        ],

        EN_TALLER: [
          "DISPONIBLE"
        ],

        DISPONIBLE: [
          "EN_TALLER"
        ],
      };

      return (
        map[vehicle.estado] ?? []
      );
    }


    return [];

  }, [
    vehicle,
    management,
    roles,
  ]);


  /* =========================================================
     LOADING Y ERROR
     ========================================================= */

  if (loading) {
    return (
      <LoadingState
        label="Cargando vehículo…"
      />
    );
  }


  if (loadError || !vehicle) {
    return (
      <ErrorState
        title="No pudimos abrir el vehículo"
        description={
          loadError ||
          "El vehículo no está disponible."
        }
        onRetry={() => void load()}
      />
    );
  }


  /* =========================================================
     CAMBIAR ESTADO
     ========================================================= */

  const changeState = async (
    state: EstadoVehiculo
  ) => {

    setBusy(true);

    try {

      const updatedVehicle =
        await vehiculoService.state(
          id,
          state
        );

      setVehicle(updatedVehicle);

      setHistory((current) => {

        if (!current) {
          return null;
        }

        return {
          ...current,
          vehiculo: updatedVehicle,
        } as VehiculoHistorial;

      });


      show(
        "Estado actualizado.",
        "success"
      );

    } catch (error) {

      show(
        errorMessage(error),
        "error"
      );

    } finally {

      setBusy(false);

    }
  };


  /* =========================================================
     DATOS DEL HISTORIAL
     ========================================================= */

  const refacciones:
    RefaccionHistorialView[] =
    history
      ? history.refacciones as RefaccionHistorialView[]
      : [];


  /*
   * Para ADMINISTRADOR / DUENO / VENDEDOR
   */
  const compra =
    history && "compra" in history
      ? history.compra as CompraHistorialView | null
      : null;


  const venta =
    history && "venta" in history
      ? history.venta as VentaHistorialView | null
      : null;


  /*
   * Para TALLER
   */
  const fechaCompra =
    history && "fechaCompra" in history
      ? history.fechaCompra
      : null;


  const fechaVenta =
    history && "fechaVenta" in history
      ? history.fechaVenta
      : null;


  /*
   * Determina si la venta contiene
   * información económica gerencial.
   */
  const tieneResumenEconomico =
    management &&
    venta &&
    (
      venta.costoCompraAlVender !== undefined ||
      venta.costoRefaccionesAlVender !== undefined ||
      venta.costoTotalAlVender !== undefined ||
      venta.rentabilidadCalculada !== undefined
    );


  return (
    <>

      <PageHeader
        title={`${vehicle.marca} ${vehicle.modelo}`}
        description={`${vehicle.anio} · ${vehicle.matricula}`}

        actions={
          <>
            <Link
              className="button button--secondary"
              to="/app/vehiculos"
            >
              <ArrowLeft size={17} />
              Volver
            </Link>


            {commercial && (
              <Link
                className="button"
                to={`/app/vehiculos/${id}/editar`}
              >
                <Pencil size={17} />
                Editar
              </Link>
            )}

          </>
        }
      />


      <div className="split">

        {/* =====================================================
            COLUMNA PRINCIPAL
           ===================================================== */}

        <div className="grid">


          {/* DATOS GENERALES */}

          <section className="card">

            <div className="section-title">

              <h2>
                Datos generales
              </h2>

              <StatusBadge
                value={vehicle.estado}
              />

            </div>


            <div className="detail-list">

              <Detail
                label="Color"
                value={vehicle.color}
              />


              <Detail
                label="Kilometraje"
                value={
                  vehicle.kilometraje
                    ? `${Intl.NumberFormat(
                        "es-UY"
                      ).format(
                        vehicle.kilometraje
                      )} km`
                    : "—"
                }
              />


              <Detail
                label="Chasis"
                value={
                  vehicle.numeroChasis
                }
              />


              {commercial && (
                <Detail
                  label="Precio estimado"
                  value={formatCurrency(
                    vehicle.precioVentaEstimado
                  )}
                />
              )}


              <Detail
                label="Catálogo"
                value={
                  vehicle.publicado
                    ? "Publicado"
                    : "No publicado"
                }
              />


              <Detail
                label="Activo"
                value={
                  vehicle.activo
                    ? "Sí"
                    : "No"
                }
              />

            </div>


            {vehicle.descripcionPublica && (

              <div
                style={{
                  marginTop: 16,
                }}
              >

                <strong>
                  Descripción pública
                </strong>

                <p className="muted">
                  {
                    vehicle.descripcionPublica
                  }
                </p>

              </div>

            )}


            {management &&
              vehicle.observacionesInternas && (

              <div>

                <strong>
                  Observaciones internas
                </strong>

                <p className="muted">
                  {
                    vehicle.observacionesInternas
                  }
                </p>

              </div>

            )}

          </section>


          {/* IMÁGENES */}

          <VehicleImages
            vehicleId={id}
          />


          {/* =====================================================
              HISTORIAL DEL VEHÍCULO
             ===================================================== */}

          {history && (

            <section className="card">

              <h2>
                Historial del vehículo
              </h2>


              {/* ==========================
                  COMPRA
                 ========================== */}

              {compra && (

                <div
                  className="timeline-row"
                  style={{
                    marginTop: 16,
                  }}
                >

                  <div>

                    <strong>
                      Compra
                    </strong>


                    {compra.fechaCompra && (

                      <p>

                        Fecha:{" "}

                        {
                          formatDate(
                            compra.fechaCompra
                          )
                        }

                      </p>

                    )}


                    {compra.clienteVendedor && (

                      <p>

                        Vendedor:{" "}

                        {
                          compra.clienteVendedor
                        }

                      </p>

                    )}

                  </div>

                </div>

              )}


              {/* ==========================
                  COMPRA TALLER
                 ========================== */}

              {fechaCompra && (

                <div
                  className="timeline-row"
                  style={{
                    marginTop: 16,
                  }}
                >

                  <div>

                    <strong>
                      Compra
                    </strong>

                    <p>

                      Fecha:{" "}

                      {
                        formatDate(
                          fechaCompra
                        )
                      }

                    </p>

                  </div>

                </div>

              )}


              {/* ==========================
                  REFACCIONES
                 ========================== */}

              <div
                style={{
                  marginTop: 20,
                }}
              >

                <strong>
                  Refacciones y trabajos
                </strong>


                {refacciones.length ? (

                  <div
                    style={{
                      marginTop: 12,
                    }}
                  >

                    {refacciones.map(
                      (repair) => (

                        <div
                          className="timeline-row"
                          key={repair.id}
                        >

                          <StatusBadge
                            value={
                              repair.estadoTarea
                            }
                          />


                          <div>

                            <strong>
                              {
                                repair.tipoTrabajo
                              }
                            </strong>


                            <p>
                              {
                                repair.descripcion
                              }
                            </p>


                            <small>

                              {
                                formatDate(
                                  repair.fecha
                                )
                              }

                            </small>

                          </div>

                        </div>

                      )
                    )}

                  </div>

                ) : (

                  <p className="muted">

                    No hay refacciones registradas
                    para esta unidad.

                  </p>

                )}

              </div>


              {/* ==========================
                  VENTA
                 ========================== */}

              {venta && (

                <div
                  className="timeline-row"
                  style={{
                    marginTop: 20,
                  }}
                >

                  <div>

                    <strong>
                      Venta
                    </strong>


                    {venta.fechaVenta && (

                      <p>

                        Fecha:{" "}

                        {
                          formatDate(
                            venta.fechaVenta
                          )
                        }

                      </p>

                    )}


                    {venta.clienteComprador && (

                      <p>

                        Cliente:{" "}

                        {
                          venta.clienteComprador
                        }

                      </p>

                    )}


                    {venta.precioFinal !== undefined && (

                      <p>

                        Precio final:{" "}

                        {
                          formatCurrency(
                            venta.precioFinal
                          )
                        }

                      </p>

                    )}

                  </div>

                </div>

              )}


              {/* ==========================
                  VENTA TALLER
                 ========================== */}

              {fechaVenta && (

                <div
                  className="timeline-row"
                  style={{
                    marginTop: 20,
                  }}
                >

                  <div>

                    <strong>
                      Venta
                    </strong>

                    <p>

                      Fecha:{" "}

                      {
                        formatDate(
                          fechaVenta
                        )
                      }

                    </p>

                  </div>

                </div>

              )}

            </section>

          )}


          {/* =====================================================
              TRABAJOS DE TALLER
             ===================================================== */}

          {workshop && (

            <section className="card">

              <h2>
                Trabajos de taller
              </h2>


              {refacciones.length ? (

                refacciones
                  .slice(0, 8)
                  .map((r) => (

                    <div
                      className="timeline-row"
                      key={r.id}
                    >

                      <StatusBadge
                        value={
                          r.estadoTarea
                        }
                      />


                      <div>

                        <strong>
                          {
                            r.tipoTrabajo
                          }
                        </strong>

                        <p>
                          {
                            r.descripcion
                          }
                        </p>

                        <small>
                          {
                            formatDate(
                              r.fecha
                            )
                          }
                        </small>

                      </div>

                    </div>

                  ))

              ) : (

                <p className="muted">

                  No hay refacciones registradas
                  para esta unidad.

                </p>

              )}

            </section>

          )}

        </div>


        {/* =====================================================
            COLUMNA LATERAL
           ===================================================== */}

        <aside className="grid">


          {/* CAMBIAR ESTADO */}

          <section className="card">

            <h2>
              Cambiar estado
            </h2>


            <p className="muted">

              Solo se muestran transiciones generales;
              el backend valida además el rol y las
              reglas de negocio.

            </p>


            <div className="grid">

              {allowed
                .filter(
                  (state) =>
                    !(
                      state === "DADO_DE_BAJA" &&
                      !management
                    )
                )
                .map((state) => (

                  <button
                    className="button button--secondary"
                    disabled={busy}
                    type="button"
                    onClick={() =>
                      void changeState(state)
                    }
                    key={state}
                  >

                    {
                      state.replaceAll(
                        "_",
                        " "
                      )
                    }

                  </button>

                ))}


              {!allowed.length && (

                <p className="muted">

                  No hay transiciones manuales
                  disponibles.

                </p>

              )}

            </div>

          </section>


          {/* PUBLICACIÓN */}

          {commercial &&
            vehicle.estado === "DISPONIBLE" && (

            <section className="card">

              <h2>
                Publicación
              </h2>


              <p className="muted">

                La publicación pública depende también
                de las validaciones del backend.

              </p>


              <button
                className="button button--accent"
                type="button"
                disabled={busy}

                onClick={async () => {

                  setBusy(true);

                  try {

                    const updatedVehicle =
                      await vehiculoService.publication(
                        id,
                        !vehicle.publicado
                      );

                    setVehicle(
                      updatedVehicle
                    );


                    setHistory((current) => {

                      if (!current) {
                        return null;
                      }

                      return {
                        ...current,
                        vehiculo: updatedVehicle,
                      } as VehiculoHistorial;

                    });


                    show(
                      "Publicación actualizada.",
                      "success"
                    );

                  } catch (error) {

                    show(
                      errorMessage(error),
                      "error"
                    );

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


          {/* ADMINISTRACIÓN */}

          {management &&
            vehicle.activo &&
            vehicle.estado !== "VENDIDO" && (

            <section className="card">

              <h2>
                Administración
              </h2>


              <p className="muted">

                La baja es lógica y conserva
                el historial.

              </p>


              <button
                className="button button--danger"
                type="button"
                disabled={busy}

                onClick={async () => {

                  if (
                    !confirm(
                      "¿Dar de baja este vehículo?"
                    )
                  ) {
                    return;
                  }


                  setBusy(true);

                  try {

                    await vehiculoService.deactivate(
                      id
                    );

                    show(
                      "Vehículo desactivado.",
                      "success"
                    );


                    const updatedVehicle = {
                      ...vehicle,
                      activo: false,
                    };


                    setVehicle(
                      updatedVehicle
                    );


                    setHistory((current) => {

                      if (!current) {
                        return null;
                      }

                      return {
                        ...current,
                        vehiculo: updatedVehicle,
                      } as VehiculoHistorial;

                    });

                  } catch (error) {

                    show(
                      errorMessage(error),
                      "error"
                    );

                  } finally {

                    setBusy(false);

                  }

                }}
              >

                Dar de baja

              </button>

            </section>

          )}


          {/* RESUMEN ECONÓMICO */}

          {management && (

            <section className="card">

              <h2>
                Resumen económico
              </h2>


              {tieneResumenEconomico && venta ? (

                <div className="grid">

                  <Detail
                    label="Costo compra"
                    value={formatCurrency(
                      Number(
                        venta.costoCompraAlVender ?? 0
                      )
                    )}
                  />


                  <Detail
                    label="Refacciones"
                    value={formatCurrency(
                      Number(
                        venta.costoRefaccionesAlVender ?? 0
                      )
                    )}
                  />


                  <Detail
                    label="Costo total"
                    value={formatCurrency(
                      Number(
                        venta.costoTotalAlVender ?? 0
                      )
                    )}
                  />


                  <Detail
                    label="Rentabilidad"
                    value={formatCurrency(
                      Number(
                        venta.rentabilidadCalculada ?? 0
                      )
                    )}
                  />

                </div>

              ) : (

                <p className="muted">

                  El historial económico definitivo
                  estará disponible cuando exista una
                  venta con información económica.

                </p>

              )}

            </section>

          )}

        </aside>

      </div>

    </>
  );
}


/* =========================================================
   COMPONENTE DETAIL
   ========================================================= */

function Detail({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {

  return (
    <div className="detail-item">

      <small>
        {label}
      </small>

      <strong>

        {
          value === null ||
          value === undefined ||
          value === ""
            ? "—"
            : String(value)
        }

      </strong>

    </div>
  );
}