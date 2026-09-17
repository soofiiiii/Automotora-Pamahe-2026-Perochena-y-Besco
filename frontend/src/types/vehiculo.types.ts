import type {
  Compra,
  Venta,
  Refaccion,
  ImagenVehiculo,
} from "./domain.types";


export type EstadoVehiculo = 'COMPRADO' | 'EN_TALLER' | 'DISPONIBLE' | 'RESERVADO' | 'VENDIDO' | 'DADO_DE_BAJA'

export interface Vehiculo {
  id: number
  marca: string
  modelo: string
  anio: number
  matricula: string
  numeroChasis?: string | null
  color?: string | null
  kilometraje?: number | null
  estado: EstadoVehiculo
  costoInicial?: number | null
  precioVentaEstimado?: number | null
  publicado: boolean
  descripcionPublica?: string | null
  observacionesInternas?: string | null
  activo: boolean
}

export interface VehiculoRequest {
  marca: string;
  modelo: string;
  anio: number;
  matricula: string;
  numeroChasis?: string;
  color?: string;
  kilometraje?: number;
  precioVentaEstimado?: number;
  descripcionPublica?: string;
  observacionesInternas?: string;
}

export interface CatalogoVehiculo {
  id: number;
  marca: string;
  modelo: string;
  anio: number;
  color?: string | null;
  kilometraje?: number | null;
  precioVentaEstimado?: number | null;
  descripcionPublica?: string | null;
  imagenes: string[];
  contactoWhatsapp?: string | null;
  contactoTelefono?: string | null;
}

export interface VehiculoComercial {
  id: number;
  marca: string;
  modelo: string;
  anio: number;
  matricula: string;
  numeroChasis?: string | null;
  color?: string | null;
  kilometraje?: number | null;
  estado: EstadoVehiculo;
  precioVentaEstimado?: number | null;
  publicado: boolean;
  descripcionPublica?: string | null;
  activo: boolean;
}

export interface VehiculoTaller {
  id: number;
  marca: string;
  modelo: string;
  anio: number;
  matricula: string;
  numeroChasis?: string | null;
  color?: string | null;
  kilometraje?: number | null;
  estado: EstadoVehiculo;
  descripcionPublica?: string | null;
  activo: boolean;
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

  comprobanteUrl?: string | null;
  observaciones?: string | null;
}

export interface VehiculoHistorialGerencial {
  vehiculo: Vehiculo;
  compra: Compra | null;
  refacciones: Refaccion[];
  venta: VentaHistorialGerencial | null;
  imagenes: ImagenVehiculo[];
}

export interface VehiculoHistorialComercial {
  vehiculo: VehiculoComercial;

  compra: CompraHistorialComercial | null;

  refacciones: RefaccionHistorialComercial[];

  venta: Venta | null;

  imagenes: ImagenVehiculo[];
}

export interface VehiculoHistorialTaller {
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