import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CalendarRange,
  Car,
  CircleDollarSign,
  Contact,
  PackageCheck,
  ReceiptText,
  RotateCcw,
  TrendingUp,
  Wrench,
} from "lucide-react";
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

const EMPTY_FILTERS: DateFilters = { desde: "", hasta: "" };
const PIE_COLORS = ["#1d3273", "#f2d22e", "#247a4b", "#f25d07", "#64748b", "#7c3aed"];

const compactCurrency = new Intl.NumberFormat("es-UY", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<DateFilters>(EMPTY_FILTERS);

  const loadDashboard = async (desde?: string, hasta?: string) => {
    try {
      setLoading(true);
      setError("");
      const response = await dashboardService.get(desde, hasta);
      setData(response);
    } catch (e) {
      setError(errorMessage(e, "No pudimos cargar el dashboard."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    dashboardService
      .get(undefined, undefined)
      .then(
        (response) => {
          if (active) setData(response);
        },
        (cause) => {
          if (active) setError(errorMessage(cause, "No pudimos cargar el dashboard."));
        },
      )
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleFilter = (event: React.FormEvent) => {
    event.preventDefault();
    if (filters.desde && filters.hasta && filters.desde > filters.hasta) {
      setError("La fecha desde no puede ser posterior a la fecha hasta.");
      return;
    }
    void loadDashboard(filters.desde || undefined, filters.hasta || undefined);
  };

  const handleClearFilters = () => {
    setFilters(EMPTY_FILTERS);
    void loadDashboard();
  };

  const stateData = useMemo(
    () =>
      Object.entries(data?.vehiculosPorEstado ?? {})
        .map(([name, value]) => ({ name: name.replaceAll("_", " "), value }))
        .filter((item) => item.value > 0),
    [data?.vehiculosPorEstado],
  );

  const financialData = useMemo(
    () =>
      data
        ? [
            { name: "Ingresos", value: data.ingresosPeriodo },
            { name: "Rentabilidad", value: data.rentabilidadPeriodo },
            { name: "Refacciones", value: data.inversionActualRefacciones },
          ]
        : [],
    [data],
  );

  if (loading && !data) return <LoadingState label="Cargando indicadores…" />;

  return (
    <>
      <PageHeader
        title="Dashboard gerencial"
        description="Una lectura visual del stock, la operación comercial y los principales indicadores económicos de la automotora."
      />

      <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
        <div className="flex items-start gap-3 border-b border-slate-100 bg-[linear-gradient(90deg,rgba(29,50,115,0.045),transparent)] px-5 py-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
            <CalendarRange className="size-5" />
          </span>
          <div>
            <h2 className="m-0 text-base font-extrabold text-slate-900">Período de análisis</h2>
            <p className="mb-0 mt-1 text-sm text-slate-500">
              Filtrá los indicadores comerciales por fecha o consultá el acumulado general.
            </p>
          </div>
        </div>
        <form onSubmit={handleFilter} className="grid gap-4 p-5 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <label className="field">
            <span>Desde</span>
            <input
              type="date"
              value={filters.desde}
              onChange={(event) => setFilters({ ...filters, desde: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Hasta</span>
            <input
              type="date"
              value={filters.hasta}
              onChange={(event) => setFilters({ ...filters, hasta: event.target.value })}
            />
          </label>
          <div className="dashboard-filter-actions flex flex-wrap gap-2 lg:justify-end">
            <button type="submit" className="button" disabled={loading}>
              {loading ? "Actualizando…" : "Aplicar período"}
            </button>
            <button
              type="button"
              className="button button--secondary"
              onClick={handleClearFilters}
              disabled={loading}
            >
              <RotateCcw className="size-4" /> Limpiar
            </button>
          </div>
          <p className="mb-0 text-xs font-semibold text-slate-500 lg:col-span-3">
            {data?.periodoDesde || data?.periodoHasta ? (
              <>
                Período consultado: <strong>{data.periodoDesde ?? "Sin fecha inicial"}</strong> —{" "}
                <strong>{data.periodoHasta ?? "Sin fecha final"}</strong>
              </>
            ) : (
              "Mostrando información general acumulada."
            )}
          </p>
        </form>
      </section>

      {error && (
        <div className="notice notice--warning mb-6" role="alert">
          {error}
        </div>
      )}

      {data && (
        <div className="grid gap-7">
          <section>
            <SectionHeading
              title="Situación operativa"
              description="Estado actual del inventario y base comercial."
            />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              <KpiCard icon={<Car />} label="Vehículos activos" value={data.vehiculosActivos} tone="brand" />
              <KpiCard icon={<Wrench />} label="En taller" value={data.vehiculosEnTaller} tone="amber" />
              <KpiCard icon={<Wrench />} label="Tareas pendientes" value={data.tareasTallerPendientes} tone="amber" />
              <KpiCard icon={<PackageCheck />} label="Disponibles" value={data.vehiculosDisponibles} tone="green" />
              <KpiCard icon={<ReceiptText />} label="Vendidos" value={data.vehiculosVendidos} tone="blue" />
              <KpiCard icon={<Contact />} label="Clientes activos" value={data.clientesActivos} tone="slate" />
            </div>
          </section>

          <section>
            <SectionHeading
              title="Actividad comercial"
              description="Resultados del período seleccionado y acumulados de referencia."
            />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <KpiCard icon={<ReceiptText />} label="Ventas del período" value={data.ventasPeriodo} tone="brand" />
              <KpiCard icon={<CircleDollarSign />} label="Ingresos del período" value={formatCurrency(data.ingresosPeriodo)} tone="blue" />
              <KpiCard icon={<TrendingUp />} label="Rentabilidad del período" value={formatCurrency(data.rentabilidadPeriodo)} tone="green" />
              <KpiCard icon={<Wrench />} label="Inversión en refacciones" value={formatCurrency(data.inversionActualRefacciones)} tone="amber" />
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <ChartCard
              title="Distribución del inventario"
              description="Participación de los vehículos según su estado actual."
            >
              {stateData.length ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stateData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={72}
                      outerRadius={108}
                      paddingAngle={3}
                      stroke="transparent"
                    >
                      {stateData.map((item, index) => (
                        <Cell key={item.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [Number(value), "Vehículos"]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <ChartEmpty />
              )}
              <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-2">
                {stateData.map((item, index) => (
                  <span key={item.name} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <i
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                    />
                    {item.name.toLowerCase()} · {item.value}
                  </span>
                ))}
              </div>
            </ChartCard>

            <ChartCard
              title="Resultado económico del período"
              description="Comparación visual entre ingresos, rentabilidad e inversión de taller."
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={financialData} margin={{ top: 12, right: 8, bottom: 4, left: 4 }}>
                  <CartesianGrid stroke="#e8edf4" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis
                    tickFormatter={(value) => compactCurrency.format(Number(value))}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    width={54}
                  />
                  <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Monto"]} />
                  <Bar dataKey="value" fill="#1d3273" radius={[8, 8, 2, 2]} maxBarSize={58} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
            <div className="card">
              <SectionHeading title="Acumulado histórico" description="Valores consolidados registrados en el sistema." compact />
              <div className="detail-list mt-4">
                <div className="detail-item"><small>Ventas registradas</small><strong>{data.ventasRegistradas}</strong></div>
                <div className="detail-item"><small>Ingresos por ventas</small><strong>{formatCurrency(data.ingresosVentas)}</strong></div>
                <div className="detail-item"><small>Rentabilidad acumulada</small><strong>{formatCurrency(data.rentabilidadAcumulada)}</strong></div>
              </div>
            </div>
            <div className="rounded-2xl bg-[linear-gradient(145deg,#1d3273,#142450)] p-5 text-white shadow-[0_16px_34px_rgba(29,50,115,0.2)]">
              <span className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-sun">Lectura rápida</span>
              <h2 className="mb-2 mt-2 text-xl font-black tracking-[-0.03em]">Panorama del período</h2>
              <p className="mb-5 text-sm leading-6 text-white/65">
                Utilizá estos datos como referencia operativa. Los reportes permiten profundizar el análisis por módulo.
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <QuickMetric label="Stock disponible" value={data.vehiculosDisponibles} />
                <QuickMetric label="En taller" value={data.vehiculosEnTaller} />
                <QuickMetric label="Ventas" value={data.ventasPeriodo} />
                <QuickMetric label="Rentabilidad" value={formatCurrency(data.rentabilidadPeriodo)} />
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function SectionHeading({ title, description, compact = false }: { title: string; description: string; compact?: boolean }) {
  return (
    <div className={compact ? "" : "mb-3"}>
      <h2 className="m-0 text-lg font-black tracking-[-0.025em] text-slate-900">{title}</h2>
      <p className="mb-0 mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function ChartCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <article className="dashboard-chart-card overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
      <h2 className="m-0 text-lg font-black tracking-[-0.025em] text-slate-900">{title}</h2>
      <p className="mb-2 mt-1 text-sm text-slate-500">{description}</p>
      {children}
    </article>
  );
}

function ChartEmpty() {
  return <div className="grid h-[300px] place-items-center text-sm font-semibold text-slate-400">Todavía no hay datos para graficar.</div>;
}

type Tone = "brand" | "amber" | "green" | "blue" | "slate";
const toneClasses: Record<Tone, string> = {
  brand: "bg-brand/10 text-brand",
  amber: "bg-amber-100 text-amber-700",
  green: "bg-emerald-100 text-emerald-700",
  blue: "bg-blue-100 text-blue-700",
  slate: "bg-slate-100 text-slate-600",
};

function KpiCard({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string | number; tone: Tone }) {
  return (
    <article className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.045)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <span className={`grid size-10 place-items-center rounded-xl [&>svg]:size-5 ${toneClasses[tone]}`}>{icon}</span>
        <span className="mt-1 size-1.5 rounded-full bg-slate-200 transition-colors group-hover:bg-sun" />
      </div>
      <span className="block text-[0.72rem] font-extrabold uppercase tracking-[0.08em] text-slate-400">{label}</span>
      <strong className="mt-1.5 block text-[clamp(1.35rem,2.4vw,1.8rem)] font-black tracking-[-0.045em] text-slate-950">
        {typeof value === "number" ? Intl.NumberFormat("es-UY").format(value) : value}
      </strong>
    </article>
  );
}

function QuickMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-white/[0.08] p-3 ring-1 ring-inset ring-white/10">
      <small className="block text-[0.68rem] font-semibold text-white/50">{label}</small>
      <strong className="mt-1 block truncate text-sm font-extrabold text-white">{value}</strong>
    </div>
  );
}
