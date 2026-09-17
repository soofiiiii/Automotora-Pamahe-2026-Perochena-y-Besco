import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { dashboardService } from "../../../services/api";
import type { DashboardData } from "../../../types/domain.types";
import { LoadingState } from "../../../shared/feedback/LoadingState";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { errorMessage } from "../../../utils/errorMessage";
import { formatCurrency } from "../../../utils/formatCurrency";

interface DateFilters {
  desde: string;
  hasta: string;
}

const EMPTY_FILTERS: DateFilters = {
  desde: "",
  hasta: "",
};

export default function DashboardPage() {
  const [data, setData] =
    useState<DashboardData | null>(null);
  const [error, setError] =
    useState("");
  const [loading, setLoading] =
    useState(true);
  const [filters, setFilters] =
    useState<DateFilters>(EMPTY_FILTERS);
  const loadDashboard = async (
    desde?: string,
    hasta?: string,
  ) => {
    try {
      setLoading(true);
      setError("");
      const response =
        await dashboardService.get(
          desde,
          hasta,
        );
      setData(response);
    } catch (e) {
      setError(
        errorMessage(e),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const handleFilter = (
    event: React.FormEvent,
  ) => {
    event.preventDefault();
    if (
      filters.desde &&
      filters.hasta &&
      filters.desde > filters.hasta
    ) {
      setError(
        "La fecha desde no puede ser posterior a la fecha hasta.",
      );
      return;
    }

    void loadDashboard(
      filters.desde || undefined,
      filters.hasta || undefined,
    );
  };

  const handleClearFilters = () => {
    setFilters(
      EMPTY_FILTERS,
    );
    void loadDashboard();
  };

  if (loading && !data) {
    return (
      <LoadingState
        label="Cargando indicadores…"
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Dashboard gerencial"
        description="Resumen general y comercial de la automotora con indicadores acumulados y filtrables por período."
      />
      <section
        className="card"
        style={{
          marginBottom: 20,
        }}
      >
        <h2>
          Filtrar por período
        </h2>
        <form
          onSubmit={handleFilter}
        >
          <div
            className="grid grid--3"
          >
            <label>
              Desde
              <input
                type="date"
                value={filters.desde}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    desde:
                      event.target.value,
                  })
                }
              />
            </label>
            <label>
              Hasta
              <input
                type="date"
                value={filters.hasta}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    hasta:
                      event.target.value,
                  })
                }
              />
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "end",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <button
                type="submit"
                className="button"
                disabled={loading}
              >
                {loading
                  ? "Actualizando..."
                  : "Aplicar"}
              </button>
              <button
                type="button"
                className="button button--secondary"
                onClick={handleClearFilters}
                disabled={loading}
              >
                Limpiar
              </button>
            </div>
          </div>
        </form>
        {data?.periodoDesde ||
        data?.periodoHasta ? (
          <p
            className="muted"
            style={{
              marginTop: 14,
            }}
          >
            Período consultado:
            {" "}
            <strong>
              {data.periodoDesde ??
                "Sin fecha inicial"}
            </strong>
            {" — "}
            <strong>
              {data.periodoHasta ??
                "Sin fecha final"}
            </strong>
          </p>
        ) : (
          <p
            className="muted"
            style={{
              marginTop: 14,
            }}
          >
            Mostrando información general acumulada.
          </p>
        )}
      </section>

      {error && (
        <div
          className="notice notice--warning"
        >
          {error}
        </div>
      )}

      {data && (

        <>

          <h2>
            Indicadores generales
          </h2>

          <div
            className="grid grid--4"
          >
            <KpiCard
              label="Vehículos activos"
              value={data.vehiculosActivos}
            />
            <KpiCard
              label="En taller"
              value={data.vehiculosEnTaller}
            />
            <KpiCard
              label="Disponibles"
              value={data.vehiculosDisponibles}
            />
            <KpiCard
              label="Vendidos"
              value={data.vehiculosVendidos}
            />
            <KpiCard
              label="Clientes activos"
              value={data.clientesActivos}
            />
          </div>

          <h2
            style={{
              marginTop: 28,
            }}
          >
            Indicadores comerciales acumulados
          </h2>

          <div
            className="grid grid--3"
          >
            <KpiCard
              label="Ventas registradas"
              value={data.ventasRegistradas}
            />
            <KpiCard
              label="Ingresos por ventas"
              value={formatCurrency(
                data.ingresosVentas,
              )}
            />
            <KpiCard
              label="Rentabilidad acumulada"
              value={formatCurrency(
                data.rentabilidadAcumulada,
              )}
            />
          </div>

          <h2
            style={{
              marginTop: 28,
            }}
          >
            Indicadores del período
          </h2>

          <div
            className="grid grid--4"
          >
            <KpiCard
              label="Ventas del período"
              value={data.ventasPeriodo}
            />
            <KpiCard
              label="Ingresos del período"
              value={formatCurrency(
                data.ingresosPeriodo,
              )}
            />
            <KpiCard
              label="Rentabilidad del período"
              value={formatCurrency(
                data.rentabilidadPeriodo,
              )}
            />
            <KpiCard
              label="Inversión en refacciones"
              value={formatCurrency(
                data.inversionActualRefacciones,
              )}
            />
          </div>

          <div
            className="grid grid--2"
            style={{
              marginTop: 28,
            }}
          >
            <section
              className="card"
              style={{
                height: 350,
              }}
            >
              <h2>
                Vehículos por estado
              </h2>
              <ResponsiveContainer
                width="100%"
                height="82%"
              >
                <BarChart
                  data={
                    Object.entries(
                      data.vehiculosPorEstado ??
                        {},
                    ).map(
                      ([name, value]) => ({
                        name:
                          name.replaceAll(
                            "_",
                            " ",
                          ),
                        value,
                      }),
                    )
                  }
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{
                      fontSize: 11,
                    }}
                  />
                  <YAxis
                    allowDecimals={false}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="value"
                    fill="currentColor"
                  />
                </BarChart>
              </ResponsiveContainer>
            </section>
            <section
              className="card"
            >
              <h2>
                Lectura rápida
              </h2>

              <div
                className="detail-list"
              >
                <div
                  className="detail-item"
                >
                  <small>
                    Stock disponible
                  </small>
                  <strong>
                    {data.vehiculosDisponibles}
                  </strong>
                </div>
                <div
                  className="detail-item"
                >
                  <small>
                    Unidades en taller
                  </small>
                  <strong>
                    {data.vehiculosEnTaller}
                  </strong>
                </div>
                <div
                  className="detail-item"
                >
                  <small>
                    Ventas del período
                  </small>
                  <strong>
                    {data.ventasPeriodo}
                  </strong>
                </div>
                <div
                  className="detail-item"
                >
                  <small>
                    Rentabilidad del período
                  </small>
                  <strong>
                    {formatCurrency(
                      data.rentabilidadPeriodo,
                    )}
                  </strong>
                </div>
                <div
                  className="detail-item"
                >
                  <small>
                    Inversión en refacciones
                  </small>
                  <strong>
                    {formatCurrency(
                      data.inversionActualRefacciones,
                    )}
                  </strong>
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </>
  );
}

interface KpiCardProps {
  label: string;
  value: string | number;
}
function KpiCard({
  label,
  value,
}: KpiCardProps) {
  return (
    <div
      className="card kpi"
    >
      <span
        className="kpi__label"
      >

        {label}
      </span>
      <strong
        className="kpi__value"
      >
        {typeof value === "number"
          ? Intl.NumberFormat(
              "es-UY",
            ).format(value)
          : value}
      </strong>
    </div>
  );
}