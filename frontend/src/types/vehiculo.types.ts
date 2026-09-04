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
