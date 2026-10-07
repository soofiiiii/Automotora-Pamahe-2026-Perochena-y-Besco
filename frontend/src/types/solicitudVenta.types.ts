export type EstadoSolicitudVenta =
  | "PENDIENTE"
  | "EN_REVISION"
  | "CONTACTADA"
  | "DESCARTADA";

export interface SolicitudVentaPublicaResponse {
  id: number;
  estado: EstadoSolicitudVenta;
  creadaEn: string;
}

export interface SolicitudVentaResumen {
  id: number;
  nombre: string;
  telefono: string;
  marca: string;
  modelo: string;
  anio: number;
  kilometraje: number;
  estado: EstadoSolicitudVenta;
  cantidadFotografias: number;
  creadaEn: string;
}

export interface SolicitudVentaImagen {
  id: number;
  url: string;
}

export interface SolicitudVentaDetalle {
  id: number;
  nombre: string;
  telefono: string;
  marca: string;
  modelo: string;
  anio: number;
  kilometraje: number;
  observaciones?: string | null;
  estado: EstadoSolicitudVenta;
  revisadaPorId?: number | null;
  revisadaPor?: string | null;
  revisadaEn?: string | null;
  creadaEn: string;
  fotografias: SolicitudVentaImagen[];
}
