import { useCallback, useState, type FormEvent, type ReactNode } from "react";
import { FileSpreadsheet } from "lucide-react";
import { exportService, reporteService } from "../../../services/api";
import type { ExportName } from "../../../types/export.types";
import type {
  ReportName,
  ReporteComprasResponse,
  ReporteRefaccionesResponse,
  ReporteRentabilidadResponse,
  ReporteStockResponse,
  ReporteVentasResponse,
} from "../../../types/report.types";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { DownloadButton } from "../../../shared/components/DownloadButton";
import { LoadingState } from "../../../shared/feedback/LoadingState";
import { ErrorState } from "../../../shared/feedback/ErrorState";
import { EmptyState } from "../../../shared/feedback/EmptyState";
import { DataTable, type Column } from "../../../shared/tables/DataTable";

const csvExports: { key: ExportName; label: string }[] = [
  { key: "vehiculos", label: "Vehículos" },
  { key: "clientes", label: "Clientes" },
  { key: "ventas", label: "Ventas" },
  { key: "compras", label: "Compras" },
  { key: "refacciones", label: "Refacciones" },
  { key: "costos-vehiculos", label: "Costos por vehículo" },
];

type ReportData = ReporteVentasResponse | ReporteComprasResponse | ReporteStockResponse | ReporteRefaccionesResponse | ReporteRentabilidadResponse;

const reportOptions: Array<{ value: ReportName; label: string }> = [
  { value: "ventas", label: "Ventas" },
  { value: "compras", label: "Compras" },
  { value: "stock", label: "Stock al cierre" },
  { value: "vendidos", label: "Vehículos vendidos" },
  { value: "refacciones", label: "Refacciones" },
  { value: "rentabilidad", label: "Rentabilidad" },
];

const reportFilename: Record<ReportName, string> = {
  ventas: "ventas",
  compras: "compras",
  stock: "stock",
  vendidos: "vehiculos-vendidos",
  refacciones: "refacciones",
  rentabilidad: "rentabilidad",
};

const money = new Intl.NumberFormat("es-UY", { style: "currency", currency: "UYU", maximumFractionDigits: 2 });
const number = new Intl.NumberFormat("es-UY");
const formatMoney = (value: number | null | undefined) => value == null ? "-" : money.format(value);
const formatDate = (value: string) => new Intl.DateTimeFormat("es-UY").format(new Date(`${value}T00:00:00`));

function Kpis({ children }: { children: ReactNode }) {
  return <div className="grid grid--3" style={{ marginBottom: "1.5rem" }}>{children}</div>;
}

function Kpi({ label, value }: { label: string; value: ReactNode }) {
  return <article className="card"><span className="muted">{label}</span><strong style={{ display: "block", fontSize: "1.45rem", marginTop: ".35rem" }}>{value}</strong></article>;
}

function ReportResult({ kind, data }: { kind: ReportName; data: ReportData }) {
  if (kind === "ventas" || kind === "vendidos") {
    const report = data as ReporteVentasResponse;
    const columns: Column<(typeof report.ventas)[number]>[] = [
      { key: "fecha", header: "Fecha", cell: (row) => formatDate(row.fechaVenta) },
      { key: "vehiculo", header: "Vehículo", cell: (row) => row.vehiculo },
      { key: "precio", header: "Precio final", cell: (row) => formatMoney(row.precioFinal) },
      { key: "rentabilidad", header: "Rentabilidad", cell: (row) => formatMoney(row.rentabilidad) },
    ];
    return <><Kpis><Kpi label="Operaciones" value={number.format(report.cantidadVentas)} /><Kpi label="Ingresos" value={formatMoney(report.ingresos)} /><Kpi label="Rentabilidad" value={formatMoney(report.rentabilidad)} /></Kpis>{report.ventas.length ? <DataTable rows={report.ventas} columns={columns} keyOf={(row) => row.ventaId} caption={kind === "ventas" ? "Ventas del período" : "Vehículos vendidos del período"} /> : <EmptyState title="Sin operaciones en el período" />}</>;
  }

  if (kind === "compras") {
    const report = data as ReporteComprasResponse;
    const columns: Column<(typeof report.compras)[number]>[] = [
      { key: "fecha", header: "Fecha", cell: (row) => formatDate(row.fechaCompra) },
      { key: "vehiculo", header: "Vehículo", cell: (row) => row.vehiculo },
      { key: "costo", header: "Costo de adquisición", cell: (row) => formatMoney(row.costoAdquisicion) },
    ];
    return <><Kpis><Kpi label="Compras" value={number.format(report.cantidadCompras)} /><Kpi label="Inversión" value={formatMoney(report.inversionCompras)} /><Kpi label="Período" value={`${formatDate(report.desde)} - ${formatDate(report.hasta)}`} /></Kpis>{report.compras.length ? <DataTable rows={report.compras} columns={columns} keyOf={(row) => row.compraId} caption="Compras del período" /> : <EmptyState title="Sin compras en el período" />}</>;
  }

  if (kind === "stock") {
    const report = data as ReporteStockResponse;
    const columns: Column<(typeof report.vehiculos)[number]>[] = [
      { key: "vehiculo", header: "Vehículo", cell: (row) => `${row.marca} ${row.modelo}` },
      { key: "anio", header: "Año", cell: (row) => row.anio },
      { key: "estado", header: "Estado actual", cell: (row) => row.estado },
      { key: "precio", header: "Precio estimado", cell: (row) => formatMoney(row.precioVentaEstimado) },
    ];
    return <><Kpis><Kpi label="Ingresados en período" value={number.format(report.vehiculosIngresados)} /><Kpi label="Stock al cierre" value={number.format(report.stockAlCierre)} /><Kpi label="Publicados actualmente" value={number.format(report.publicados)} /></Kpis>{report.vehiculos.length ? <DataTable rows={report.vehiculos} columns={columns} keyOf={(row) => row.vehiculoId} caption="Stock al cierre del período" /> : <EmptyState title="Sin vehículos para el período" />}{report.estadoYPublicacionRepresentanSituacionActual && <p className="muted" style={{ marginTop: "1rem" }}>El estado y la publicación mostrados corresponden a la situación operativa actual.</p>}</>;
  }

  if (kind === "refacciones") {
    const report = data as ReporteRefaccionesResponse;
    const columns: Column<(typeof report.refacciones)[number]>[] = [
      { key: "fecha", header: "Fecha", cell: (row) => formatDate(row.fecha) },
      { key: "vehiculo", header: "Vehículo", cell: (row) => row.vehiculo },
      { key: "tipo", header: "Trabajo", cell: (row) => row.tipoTrabajo.replaceAll("_", " ") },
      { key: "total", header: "Costo total", cell: (row) => formatMoney(row.costoTotal) },
    ];
    return <><Kpis><Kpi label="Refacciones" value={number.format(report.cantidadRefacciones)} /><Kpi label="Repuestos" value={formatMoney(report.costoRepuestos)} /><Kpi label="Costo total" value={formatMoney(report.costoTotal)} /></Kpis>{report.refacciones.length ? <DataTable rows={report.refacciones} columns={columns} keyOf={(row) => row.refaccionId} caption="Refacciones del período" /> : <EmptyState title="Sin refacciones en el período" />}</>;
  }

  const report = data as ReporteRentabilidadResponse;
  const columns: Column<(typeof report.operaciones)[number]>[] = [
    { key: "fecha", header: "Fecha", cell: (row) => formatDate(row.fechaVenta) },
    { key: "vehiculo", header: "Vehículo", cell: (row) => row.vehiculo },
    { key: "costo", header: "Costo total", cell: (row) => formatMoney(row.costoTotal) },
    { key: "rentabilidad", header: "Rentabilidad", cell: (row) => formatMoney(row.rentabilidad) },
  ];
  return <><Kpis><Kpi label="Vehículos vendidos" value={number.format(report.vehiculosVendidos)} /><Kpi label="Rentabilidad" value={formatMoney(report.rentabilidad)} /><Kpi label="Margen" value={`${Number(report.margenPorcentual).toLocaleString("es-UY", { maximumFractionDigits: 2 })}%`} /></Kpis>{report.operaciones.length ? <DataTable rows={report.operaciones} columns={columns} keyOf={(row) => row.ventaId} caption="Rentabilidad por operación" /> : <EmptyState title="Sin operaciones para calcular rentabilidad" />}</>;
}

export default function ReportesPage() {
  const [kind, setKind] = useState<ReportName>("ventas");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [period, setPeriod] = useState({ desde: "", hasta: "" });
  const [validationError, setValidationError] = useState("");

  const load = useCallback((signal: AbortSignal): Promise<ReportData> => {
    const args: [string | undefined, string | undefined, AbortSignal] = [period.desde || undefined, period.hasta || undefined, signal];
    return reporteService[kind](...args) as Promise<ReportData>;
  }, [kind, period]);

  const { data, loading, error, retry } = useApiQuery(load);

  const applyPeriod = (event: FormEvent) => {
    event.preventDefault();
    if (desde && hasta && desde > hasta) {
      setValidationError("La fecha desde no puede ser posterior a la fecha hasta.");
      return;
    }
    setValidationError("");
    setPeriod({ desde, hasta });
  };

  const pdfFilename = data
    ? `pamahe-reporte-${reportFilename[kind]}-${data.desde}-a-${data.hasta}.pdf`
    : `pamahe-reporte-${reportFilename[kind]}.pdf`;

  return (
    <>
      <PageHeader title="Reportes de gestión" description="Consultá ventas, compras, stock, vendidos, refacciones y rentabilidad por período. Cada reporte puede descargarse en PDF; el CSV se mantiene como formato complementario para análisis externo." />

      <section className="card" aria-labelledby="report-query-title" style={{ marginBottom: "1.5rem" }}>
        <h2 id="report-query-title">Consulta</h2>
        <form className="form-grid" onSubmit={applyPeriod}>
          <label className="field"><span>Reporte</span><select value={kind} onChange={(event) => setKind(event.target.value as ReportName)}>{reportOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className="field"><span>Desde</span><input type="date" value={desde} max={hasta || undefined} onChange={(event) => setDesde(event.target.value)} /></label>
          <label className="field"><span>Hasta</span><input type="date" value={hasta} min={desde || undefined} onChange={(event) => setHasta(event.target.value)} /></label>
          <div className="actions"><button className="button button--primary" type="submit">Consultar período</button><button className="button button--secondary" type="button" onClick={() => { setDesde(""); setHasta(""); setValidationError(""); setPeriod({ desde: "", hasta: "" }); }}>Período actual</button></div>
        </form>
        {validationError && <p className="field__error" role="alert">{validationError}</p>}
      </section>

      <section aria-live="polite" aria-busy={loading}>
        {loading ? <LoadingState label="Generando reporte…" /> : error ? <ErrorState description={error} onRetry={retry} /> : data ? <><div className="actions" style={{ justifyContent: "flex-end", marginBottom: "1rem" }}><DownloadButton load={() => reporteService.pdf(kind, period.desde || undefined, period.hasta || undefined)} filename={pdfFilename} label="Descargar reporte PDF" errorFallback="No pudimos generar el reporte PDF. Intentá nuevamente." /></div><ReportResult kind={kind} data={data} /></> : <EmptyState title="Sin datos de reporte" />}
      </section>

      <section aria-labelledby="csv-title" style={{ marginTop: "2.25rem" }}>
        <h2 id="csv-title">Exportaciones CSV</h2>
        <p className="muted">Formato complementario para análisis de datos en planillas de cálculo.</p>
        <div className="grid grid--3">
          {csvExports.map((item) => <article className="card module-card" key={item.key}><FileSpreadsheet aria-hidden="true" /><h3>{item.label}</h3><DownloadButton load={() => exportService.file(item.key)} filename={`pamahe-${item.key}.csv`} label={`Exportar ${item.label.toLowerCase()}`} /></article>)}
        </div>
      </section>
    </>
  );
}
