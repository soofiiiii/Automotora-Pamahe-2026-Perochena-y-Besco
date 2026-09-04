export interface ApiErrorBody {
  ok?: boolean
  codigo?: string
  mensaje?: string
  fecha?: string
  ruta?: string
  incidenteId?: string
  detalles?: unknown
  status?: number
  error?: string
  message?: string
}
export interface ApiEnvelope<T> { ok: boolean; mensaje: string; data: T }
