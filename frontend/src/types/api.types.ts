export interface ApiErrorBody {
  ok?: boolean;
  codigo?: string;
  mensaje?: string;
  fecha?: string;
  ruta?: string;
  incidenteId?: string;
  detalles?: unknown;
  status?: number;
  error?: string;
  message?: string;
}

export interface ApiEnvelope<T> {
  ok: boolean;
  mensaje: string;
  data: T;
}

export interface PageRequest {
  page?: number;
  size?: number;
  sort?: string;
}

export interface PageResult<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  serverPaged: boolean;
}
