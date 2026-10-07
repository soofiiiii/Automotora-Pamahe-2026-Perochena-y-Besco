export type ReportName =
  | "ventas"
  | "compras"
  | "stock"
  | "vendidos"
  | "refacciones"
  | "rentabilidad";

import type { EstadoVehiculo } from "./vehiculo.types";
import type { EstadoRefaccion, TipoTrabajo } from "./domain.types";

export interface ReporteVentaItem {
  ventaId: number;
  vehiculoId: number;
  vehiculo: string;
  fechaVenta: string;
  precioFinal: number;
  costoTotal: number;
  rentabilidad: number;
}

export interface ReporteVentasResponse {
  desde: string;
  hasta: string;
  cantidadVentas: number;
  ingresos: number;
  costoTotal: number;
  rentabilidad: number;
  ventas: ReporteVentaItem[];
}

export interface ReporteCompraItem {
  compraId: number;
  vehiculoId: number;
  vehiculo: string;
  fechaCompra: string;
  costoAdquisicion: number;
}

export interface ReporteComprasResponse {
  desde: string;
  hasta: string;
  cantidadCompras: number;
  inversionCompras: number;
  compras: ReporteCompraItem[];
}

export interface ReporteVehiculoStockItem {
  vehiculoId: number;
  marca: string;
  modelo: string;
  anio: number;
  tipoVehiculo: string | null;
  estado: EstadoVehiculo;
  publicado: boolean;
  precioVentaEstimado: number | null;
  fechaIngreso: string;
}

export interface ReporteStockResponse {
  desde: string;
  hasta: string;
  vehiculosIngresados: number;
  stockAlCierre: number;
  disponibles: number;
  publicados: number;
  estadoYPublicacionRepresentanSituacionActual: boolean;
  vehiculos: ReporteVehiculoStockItem[];
}

export interface ReporteRefaccionItem {
  refaccionId: number;
  vehiculoId: number;
  vehiculo: string;
  fecha: string;
  tipoTrabajo: TipoTrabajo;
  estadoTarea: EstadoRefaccion;
  costoRepuestos: number;
  costoManoObra: number;
  costoServiciosExternos: number;
  costoTotal: number;
}

export interface ReporteRefaccionesResponse {
  desde: string;
  hasta: string;
  cantidadRefacciones: number;
  costoRepuestos: number;
  costoManoObra: number;
  costoServiciosExternos: number;
  costoTotal: number;
  refacciones: ReporteRefaccionItem[];
}

export interface ReporteRentabilidadResponse {
  desde: string;
  hasta: string;
  vehiculosVendidos: number;
  ingresos: number;
  costoTotal: number;
  rentabilidad: number;
  margenPorcentual: number;
  operaciones: ReporteVentaItem[];
}
