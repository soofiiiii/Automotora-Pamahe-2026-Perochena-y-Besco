import axios from "axios";
import type { ApiErrorBody } from "../types/api.types";

export const errorMessage = (
  error: unknown,
  fallback = "No se pudo completar la operación.",
) => {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) {
      return "No se pudo conectar con el servidor. Verificá la conexión y que la API esté encendida.";
    }

    const status = error.response.status;
    const body = error.response.data;
    const backendMessage = body?.mensaje ?? body?.message ?? body?.error;
    const incident = body?.incidenteId ? ` Código de incidente: ${body.incidenteId}.` : "";

    if (backendMessage) return `${backendMessage}${incident}`;
    if (status === 400) return `Los datos enviados no son válidos.${incident}`;
    if (status === 401) return "La sesión venció o las credenciales no son válidas.";
    if (status === 403) return "No tenés permisos para realizar esta operación.";
    if (status === 404) return "El recurso solicitado ya no existe o no está disponible.";
    if (status === 409) return `La operación entra en conflicto con el estado actual del sistema.${incident}`;
    if (status >= 500) return `El servidor no pudo completar la operación.${incident}`;
  }

  return error instanceof Error && error.message ? error.message : fallback;
};
