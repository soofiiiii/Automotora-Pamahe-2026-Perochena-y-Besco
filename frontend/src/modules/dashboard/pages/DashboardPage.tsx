import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { dashboardService } from "../../../services/api";
import type { DashboardData } from "../../../types/domain.types";
import { LoadingState } from "../../../shared/feedback/LoadingState";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { errorMessage } from "../../../utils/errorMessage";
import { formatCurrency } from "../../../utils/formatCurrency";

const labels: Record<string, string> = {
  vehiculosActivos: "Vehículos activos",
  vehiculosEnTaller: "En taller",
  vehiculosDisponibles: "Disponibles",
  vehiculosVendidos: "Vendidos",
  clientesActivos: "Clientes activos",
  ventasRegistradas: "Ventas registradas",
  ingresosVentas: "Ingresos por ventas",
  rentabilidadAcumulada: "Rentabilidad acumulada",
};

const moneyKeys = new Set(["ingresosVentas", "rentabilidadAcumulada"]);

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    dashboardService
      .get()
      .then(setData)
      .catch((e) => setError(errorMessage(e)));
  }, []);

  const nums = useMemo(
    () =>
      data
        ? (Object.entries(data).filter(
            ([key, v]) => key !== "vehiculosPorEstado" && typeof v === "number",
          ) as Array<[string, number]>)
        : [],
    [data],
  );

  if (!data && !error) return <LoadingState label="Cargando indicadores…" />;
  
  return (
    <>
      <PageHeader
        title="Dashboard gerencial"
        description="Resumen expuesto por el backend actual. Las métricas monetarias y comerciales son acumuladas mientras la API no incorpore rangos de fecha."
      />
      {error && <div className="notice notice--warning">{error}</div>}
      {data && (
        <>
          <div className="grid grid--4">
            {nums.map(([k, v]) => (
              <div className="card kpi" key={k}>
                <span className="kpi__label">{labels[k] ?? k}</span>
                <strong className="kpi__value">
                  {moneyKeys.has(k)
                    ? formatCurrency(v)
                    : Intl.NumberFormat("es-UY").format(v)}
                </strong>
              </div>
            ))}
          </div>
          <div className="grid grid--2" style={{ marginTop: 20 }}>
            <section className="card" style={{ height: 350 }}>
              <h2>Vehículos por estado</h2>
              <ResponsiveContainer width="100%" height="82%">
                <BarChart
                  data={Object.entries(data.vehiculosPorEstado ?? {}).map(
                    ([name, value]) => ({
                      name: name.replaceAll("_", " "),
                      value,
                    }),
                  )}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="currentColor" />
                </BarChart>
              </ResponsiveContainer>
            </section>
            <section className="card">
              <h2>Lectura rápida</h2>
              <div className="detail-list">
                <div className="detail-item">
                  <small>Stock disponible</small>
                  <strong>{data.vehiculosDisponibles}</strong>
                </div>
                <div className="detail-item">
                  <small>Unidades en taller</small>
                  <strong>{data.vehiculosEnTaller}</strong>
                </div>
                <div className="detail-item">
                  <small>Ventas registradas</small>
                  <strong>{data.ventasRegistradas}</strong>
                </div>
                <div className="detail-item">
                  <small>Rentabilidad acumulada</small>
                  <strong>{formatCurrency(data.rentabilidadAcumulada)}</strong>
                </div>
              </div>
              <p className="muted" style={{ marginTop: 16 }}>
                Para métricas mensuales o por período se requiere ampliar
                `/reportes/dashboard` en el backend.
              </p>
            </section>
          </div>
        </>
      )}
    </>
  );
}
