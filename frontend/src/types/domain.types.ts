export type TipoCliente = "COMPRADOR" | "VENDEDOR" | "AMBOS";

export interface Cliente {
  id: number;
  nombre: string;
  apellido?: string | null;
  razonSocial?: string | null;
  documento: string;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  tipoCliente: TipoCliente;
  activo: boolean;
}

export interface ClienteRequest {
  nombre: string;
  apellido?: string;
  razonSocial?: string;
  documento: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  tipoCliente: TipoCliente;
}

export interface Compra {
  id: number;
  vehiculoId: number;
  vehiculo: string;
  clienteVendedorId: number;
  clienteVendedor: string;
  usuarioResponsableId?: number | null;
  usuarioResponsable?: string | null;
  fechaCompra: string;
  costoAdquisicion: number;
  comprobanteUrl?: string | null;
  observaciones?: string | null;
}

export interface CompraRegistroResponse {
  id: number;
  vehiculoId: number;
  vehiculo: string;
  clienteVendedorId: number;
  clienteVendedor: string;
  usuarioResponsableId: number | null;
  usuarioResponsable: string | null;
  fechaCompra: string;
}

export type CompraCreateResponse = Compra | CompraRegistroResponse;

export type DestinoPostCompra = "REQUIERE_TALLER" | "PUEDE_QUEDAR_DISPONIBLE";

export interface DestinoPostCompraResponse {
  compraId: number;
  vehiculoId: number;
  estadoVehiculo: "EN_TALLER" | "DISPONIBLE";
}

export function hasCompraFinancialData(
  value: CompraCreateResponse,
): value is Compra {
  return "costoAdquisicion" in value;
}

export interface CompraRequest {
  vehiculoId: number;
  clienteVendedorId: number;
  fechaCompra: string;
  costoAdquisicion: number;
  observaciones?: string;
}

export type EstadoComprobanteVenta = "PENDIENTE" | "GENERADO" | "ERROR";
export type MedioPagoVenta =
  | "TRANSFERENCIA"
  | "EFECTIVO"
  | "FINANCIACION_BANCARIA"
  | "FINANCIACION_PROPIA"
  | "VEHICULO_PARTE_PAGO";
export type EstadoFinanciacion = "PENDIENTE" | "APROBADA" | "RECHAZADA" | "PAGADA";
export type CanalOrigenVenta =
  | "WHATSAPP"
  | "INSTAGRAM"
  | "FACEBOOK"
  | "SITIO_WEB"
  | "REFERIDO"
  | "PRESENCIAL"
  | "OTRO";

export interface Venta {
  id: number;
  vehiculoId: number;
  vehiculo: string;
  clienteCompradorId: number;
  clienteComprador: string;
  vendedorId?: number | null;
  vendedor?: string | null;
  fechaVenta: string;
  precioFinal: number;
  medioPago: MedioPagoVenta | null;
  entidadFinanciera: string | null;
  montoFinanciado: number | null;
  estadoFinanciacion: EstadoFinanciacion | null;
  canalOrigen: CanalOrigenVenta | null;
  seguimientoPostventaRealizado: boolean;
  datosCompradorVerificados: boolean;
  documentacionRevisada: boolean;
  cobroConfirmado: boolean;
  proximoMantenimiento: string | null;
  estadoComprobante: EstadoComprobanteVenta;
  intentosComprobante: number;
  ultimoIntentoComprobante: string | null;
  proximoIntentoComprobante: string | null;
  comprobanteUrl?: string | null;
  observaciones?: string | null;
}

export interface VentaDetalleGerencial extends Venta {
  costoCompraAlVender: number;
  costoRefaccionesAlVender: number;
  costoTotalAlVender: number;
  rentabilidadCalculada: number;
  errorComprobante: string | null;
}

export interface VentaRequest {
  vehiculoId: number;
  clienteCompradorId: number;
  fechaVenta: string;
  precioFinal: number;
  medioPago: MedioPagoVenta;
  entidadFinanciera?: string;
  montoFinanciado?: number;
  estadoFinanciacion?: EstadoFinanciacion;
  canalOrigen: CanalOrigenVenta;
  datosCompradorVerificados: boolean;
  documentacionRevisada: boolean;
  cobroConfirmado: boolean;
  proximoMantenimiento?: string;
  observaciones?: string;
}

export interface ActualizarProximoMantenimientoRequest {
  proximoMantenimiento: string | null;
}

export interface ActualizarFinanciacionVentaRequest {
  entidadFinanciera: string;
  montoFinanciado: number;
  estado: EstadoFinanciacion;
}

export type EstadoRefaccion = "PENDIENTE" | "EN_CURSO" | "FINALIZADA" | "CANCELADA";

export type TipoTrabajo = "MECANICA" | "PINTURA" | "CARROCERIA" | "LIMPIEZA" | "DETAILING" | "REPUESTO" | "SERVICIO_EXTERNO" | "OTRO";

export interface Refaccion {
  id: number;
  vehiculoId: number;
  vehiculo: string;
  responsableOperativoId?: number | null;
  responsableOperativo?: string | null;
  usuarioQueRegistraId?: number | null;
  usuarioQueRegistra?: string | null;
  fecha: string;
  tipoTrabajo: TipoTrabajo;
  descripcion: string;
  costoRepuestos: number;
  costoManoObra: number;
  costoServiciosExternos: number;
  costoTotal: number;
  estadoTarea: EstadoRefaccion;
  observaciones?: string | null;
  registroFotograficoUrl?: string | null;
  sincronizadoDesdeOffline?: boolean | null;
  idOperacionOffline?: string | null;
}

export interface RefaccionRequest {
  vehiculoId: number;
  responsableOperativoId?: number;
  fecha: string;
  tipoTrabajo: TipoTrabajo;
  descripcion: string;
  costoRepuestos: number;
  costoManoObra: number;
  costoServiciosExternos: number;
  estadoTarea: EstadoRefaccion;
  observaciones?: string;
  registroFotograficoUrl?: string;
  sincronizadoDesdeOffline?: boolean;
  idOperacionOffline?: string;
}

export interface RefaccionUpdateRequest {
  responsableOperativoId?: number;
  fecha: string;
  tipoTrabajo: TipoTrabajo;
  descripcion: string;
  costoRepuestos: number;
  costoManoObra: number;
  costoServiciosExternos: number;
  estadoTarea: EstadoRefaccion;
  observaciones?: string;
  registroFotograficoUrl?: string;
}

export interface CostosVehiculo {
  vehiculoId: number;
  costoCompra: number;
  costoRefacciones: number;
  costoTotal: number;
  precioVentaFinal?: number | null;
  rentabilidad?: number | null;
  historicoCerrado: boolean;
}

export interface DashboardData {
  vehiculosActivos: number;
  vehiculosEnTaller: number;
  vehiculosDisponibles: number;
  vehiculosVendidos: number;
  tareasTallerPendientes: number;
  clientesActivos: number;
  ventasRegistradas: number;
  ingresosVentas: number;
  rentabilidadAcumulada: number;
  vehiculosPorEstado: Record<string, number>;
  periodoDesde?: string | null;
  periodoHasta?: string | null;
  ventasPeriodo: number;
  ingresosPeriodo: number;
  rentabilidadPeriodo: number;
  inversionActualRefacciones: number;
}

export interface Auditoria {
  id: number;
  usuario: string;
  accion: string;
  entidad: string;
  entidadId?: number | null;
  detalle?: string | null;
  valoresAnteriores?: string | null;
  valoresNuevos?: string | null;
  creadoEn?: string;
  actualizadoEn?: string;
  activo?: boolean;
}

export interface ImagenVehiculo {
  id: number;
  vehiculoId: number;
  url: string;
  descripcion?: string | null;
  publica: boolean;
  principal: boolean;
}


export interface Notificacion {
  id: number;
  tipo: "VEHICULO_LISTO_REVISION" | "SEGUIMIENTO_POSTVENTA" | "PROXIMO_MANTENIMIENTO";
  titulo: string;
  mensaje: string;
  vehiculoId?: number | null;
  ventaId?: number | null;
  leida: boolean;
  urlDestino?: string | null;
  creadaEn: string;
}

export interface Parametro {
  id: number;
  categoria: string;
  clave: string;
  valor: string;
  descripcion?: string | null;
  activo: boolean;
}

export interface ParametroRequest {
  categoria: string;
  clave: string;
  valor: string;
  descripcion?: string;
}
