import type { Compra, Venta, Refaccion, ImagenVehiculo } from "./domain.types";

export type EstadoVehiculo = 'COMPRADO' | 'EN_TALLER' | 'DISPONIBLE' | 'RESERVADO' | 'VENDIDO' | 'DADO_DE_BAJA'

export type UbicacionVehiculo = 'LOCAL' | 'TALLER_INTERNO' | 'TALLER_EXTERNO' | 'EN_TRASLADO' | 'OTRO';

export interface VehiculoBase {
  id: number;
  marca: string;
  modelo: string;
  tipoVehiculo?: string | null;
  tipoVehiculoLabel: string | null;
  anio: number;
  matricula: string | null;
  numeroChasis?: string | null;
  color?: string | null;
  kilometraje?: number | null;
  estado: EstadoVehiculo;
  ubicacionActual: UbicacionVehiculo;
  descripcionPublica?: string | null;
  activo: boolean;
}

export type VehiculoTaller = VehiculoBase;

export interface VehiculoComercial extends VehiculoBase {
  precioVentaUsd?: number | null;
  precioVentaEstimado: number | null;
  publicado: boolean;
}

export interface VehiculoGerencial extends VehiculoComercial {
  costoInicial: number | null;
  observacionesInternas: string | null;
}

/** El objeto real solo trae los campos de su propio rol. */
export type Vehiculo = VehiculoTaller | VehiculoComercial | VehiculoGerencial;

export function hasCommercialData(vehicle: Vehiculo): vehicle is VehiculoComercial | VehiculoGerencial {
  return "publicado" in vehicle && typeof vehicle.publicado === "boolean";
}

export function hasManagementData(vehicle: Vehiculo): vehicle is VehiculoGerencial {
  return hasCommercialData(vehicle) && "costoInicial" in vehicle && "observacionesInternas" in vehicle;
}

export interface VehiculoRequest {
  marca: string;
  modelo: string;
  tipoVehiculo?: string;
  anio: number;
  matricula?: string;
  numeroChasis?: string;
  color?: string;
  kilometraje?: number;
  ubicacionActual: UbicacionVehiculo;
  precioVentaUsd?: number;
  /** Campo legado UYU: se conserva para compatibilidad con clientes anteriores. */
  precioVentaEstimado?: number;
  descripcionPublica?: string;
  observacionesInternas?: string;
}

export interface CatalogoFilters {
  marca?: string;
  modelo?: string;
  tipoVehiculo?: string;
  anioDesde?: number;
  anioHasta?: number;
  precioMin?: number;
  precioMax?: number;
}

export interface StockFilters extends CatalogoFilters {
  estado?: EstadoVehiculo;
  publicado?: boolean;
  disponibleComercial?: boolean;
}

export interface CatalogoVehiculo {
  id: number;
  marca: string;
  modelo: string;
  tipoVehiculo?: string | null;
  tipoVehiculoLabel: string | null;
  anio: number;
  estado: "DISPONIBLE" | "RESERVADO";
  color?: string | null;
  kilometraje?: number | null;
  precioVentaUsd?: number | null;
  precioVentaEstimado?: number | null;
  descripcionPublica?: string | null;
  imagenes: string[];
  contactoWhatsapp?: string | null;
  contactoTelefono?: string | null;
}

export interface CompraHistorialComercial {
  id: number;
  clienteVendedorId: number;
  clienteVendedor: string;
  fechaCompra: string;
}

export interface RefaccionHistorialComercial {
  id: number;
  fecha: string;
  tipoTrabajo: string;
  descripcion: string;
  estadoTarea: string;
}

export interface VentaHistorialGerencial {
  id: number;
  vehiculoId: number;
  vehiculo: string;

  clienteCompradorId: number;
  clienteComprador: string;

  vendedorId?: number | null;
  vendedor?: string | null;

  fechaVenta: string;

  costoCompraAlVender: number;
  costoRefaccionesAlVender: number;
  costoTotalAlVender: number;

  precioFinal: number;
  rentabilidadCalculada: number;

  estadoComprobante: "PENDIENTE" | "GENERADO" | "ERROR";
  intentosComprobante: number;
  ultimoIntentoComprobante: string | null;
  proximoIntentoComprobante: string | null;
  errorComprobante: string | null;
  comprobanteUrl?: string | null;
  observaciones?: string | null;
}

export function isVentaHistorialGerencial(
  venta: Venta | VentaHistorialGerencial | null,
): venta is VentaHistorialGerencial {
  return (
    venta !== null &&
    "costoCompraAlVender" in venta &&
    "costoRefaccionesAlVender" in venta &&
    "costoTotalAlVender" in venta &&
    "rentabilidadCalculada" in venta
  );
}

/** Evento auditado recibido en el historial; no se reconstruye desde el detalle. */
export interface HistorialEventoVehiculo {
  creadoEn: string;
  usuario: string | null;
  accion: string;
  detalle: string | null;
  /** Snapshots de auditoría opacos: la UI no los interpreta ni los muestra. */
  valoresAnteriores: string | null;
  valoresNuevos: string | null;
}

interface VehiculoHistorialEventos {
  eventos: readonly HistorialEventoVehiculo[];
}

export interface VehiculoHistorialGerencial extends VehiculoHistorialEventos {
  vehiculo: Vehiculo;
  compra: Compra | null;
  refacciones: Refaccion[];
  venta: VentaHistorialGerencial | null;
  imagenes: ImagenVehiculo[];
}

export interface VehiculoHistorialComercial extends VehiculoHistorialEventos {
  vehiculo: VehiculoComercial;

  compra: CompraHistorialComercial | null;

  refacciones: RefaccionHistorialComercial[];

  venta: Venta | null;

  imagenes: ImagenVehiculo[];
}

export interface VehiculoHistorialTaller extends VehiculoHistorialEventos {
  vehiculo: VehiculoTaller;

  fechaCompra: string | null;

  refacciones: Refaccion[];

  fechaVenta: string | null;

  imagenes: ImagenVehiculo[];
}

export type VehiculoHistorial =
  | VehiculoHistorialGerencial
  | VehiculoHistorialComercial
  | VehiculoHistorialTaller;