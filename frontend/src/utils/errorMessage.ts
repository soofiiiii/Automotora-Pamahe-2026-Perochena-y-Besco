import axios from "axios";
import type { ApiErrorBody } from "../types/api.types";

const GENERIC_ERROR = "No se pudo completar la operación. Intentá nuevamente.";

const CODE_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "Usuario o contraseña incorrectos.",
  ACCESS_DENIED: "No tenés permisos para realizar esta operación.",
  AUTH_REQUIRED: "Tu sesión no está activa. Iniciá sesión nuevamente.",
  AUTH_TOKEN_EXPIRED: "Tu sesión venció. Iniciá sesión nuevamente.",
  AUTH_TOKEN_INVALID: "Tu sesión no es válida. Iniciá sesión nuevamente.",
  AUTH_TOKEN_USER_INVALID:
    "Tu cuenta ya no está habilitada para usar el sistema. Contactá a un administrador.",
  PASSWORD_CHANGE_REQUIRED:
    "Tenés que cambiar tu contraseña antes de continuar.",
  MALFORMED_REQUEST: "No pudimos procesar la información enviada. Revisá los datos e intentá nuevamente.",
  INVALID_PARAMETER: "Uno de los valores ingresados no es válido. Revisá los datos e intentá nuevamente.",
  MISSING_PARAMETER: "Falta completar un dato obligatorio. Revisá la información e intentá nuevamente.",
  FILE_TOO_LARGE: "El archivo supera el tamaño máximo permitido.",
  DATA_CONFLICT:
    "No se pudo guardar porque los datos entran en conflicto con un registro existente. Revisá la información e intentá nuevamente.",
  IDEMPOTENCY_CONFLICT:
    "Esta operación ya fue enviada con información diferente. Revisá las operaciones pendientes antes de volver a intentarlo.",
  INTERNAL_ERROR:
    "No pudimos completar la operación por un problema interno. Intentá nuevamente en unos minutos.",
};

const TECHNICAL_MESSAGE =
  /\b(?:incident(?:e)?\s*id|stack\s*trace|sql|jdbc|hibernate|json|http\s*\d{3}|offset|uuid|idempot(?:encia|ente)|axios|fetch|network\s*error|internal\s*server\s*error|constraint|exception|respuesta\s+paginada|formato\s+esperado)\b/i;

const DEFAULT_VALIDATION_MESSAGES =
  /^(?:must\b|size must\b|should\b|failed to\b|invalid value\b)/i;

function cleanMessage(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const message = value.trim().replace(/\s+/g, " ");
  if (!message || message.length > 350) return undefined;
  if (TECHNICAL_MESSAGE.test(message) || DEFAULT_VALIDATION_MESSAGES.test(message)) {
    return undefined;
  }
  return message;
}

function validationMessage(detalles: unknown): string | undefined {
  if (!detalles || typeof detalles !== "object" || Array.isArray(detalles)) {
    return undefined;
  }

  const messages = Array.from(
    new Set(
      Object.values(detalles)
        .map(cleanMessage)
        .filter((value): value is string => Boolean(value)),
    ),
  ).slice(0, 3);

  if (!messages.length) return undefined;
  return `Revisá los datos ingresados: ${messages.join(" ")}`;
}

function retryAfterMessage(detalles: unknown): string {
  if (detalles && typeof detalles === "object" && !Array.isArray(detalles)) {
    const seconds = (detalles as { retryAfterSeconds?: unknown }).retryAfterSeconds;
    if (typeof seconds === "number" && Number.isFinite(seconds) && seconds > 0) {
      if (seconds >= 60) {
        const minutes = Math.max(1, Math.ceil(seconds / 60));
        return `Demasiados intentos de inicio de sesión. Esperá ${minutes} ${minutes === 1 ? "minuto" : "minutos"} antes de volver a intentar.`;
      }
      return `Demasiados intentos de inicio de sesión. Esperá ${Math.ceil(seconds)} segundos antes de volver a intentar.`;
    }
  }

  return "Demasiados intentos de inicio de sesión. Esperá unos minutos antes de volver a intentar.";
}

function messageFromResponse(body: ApiErrorBody | undefined, status: number): string | undefined {
  const code = body?.codigo?.trim();

  if (code === "LOGIN_RATE_LIMIT") return retryAfterMessage(body?.detalles);
  if (code === "VALIDATION_ERROR") {
    return (
      validationMessage(body?.detalles) ??
      "Revisá los datos ingresados y corregí los campos marcados."
    );
  }
  if (code && CODE_MESSAGES[code]) return CODE_MESSAGES[code];

  const backendMessage = cleanMessage(body?.mensaje ?? body?.message ?? body?.error);

  if (code === "BUSINESS_RULE" || code === "RESOURCE_NOT_FOUND") {
    return backendMessage;
  }

  if (backendMessage && status >= 400 && status < 500) {
    return backendMessage;
  }

  return undefined;
}

/**
 * Convierte errores técnicos en mensajes breves y accionables para la interfaz.
 * Los identificadores de incidente y demás datos de diagnóstico permanecen en la
 * respuesta para soporte, pero nunca se muestran como parte del mensaje al usuario.
 */
export const errorMessage = (
  error: unknown,
  fallback = GENERIC_ERROR,
): string => {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) {
      if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
        return "La operación demoró más de lo esperado. Verificá tu conexión e intentá nuevamente.";
      }
      return "No pudimos conectarnos con el sistema. Verificá tu conexión e intentá nuevamente.";
    }

    const status = error.response.status;
    const body = error.response.data;
    const responseMessage = messageFromResponse(body, status);
    if (responseMessage) return responseMessage;

    if (status === 400) return "Revisá los datos ingresados e intentá nuevamente.";
    if (status === 401) return "Tu sesión venció. Iniciá sesión nuevamente.";
    if (status === 403) return "No tenés permisos para realizar esta operación.";
    if (status === 404) return "La información solicitada ya no está disponible.";
    if (status === 408) return "La operación demoró demasiado. Intentá nuevamente.";
    if (status === 409) {
      return "No se pudo completar la operación porque la información cambió o ya existe un registro relacionado.";
    }
    if (status === 413) return "El archivo seleccionado supera el tamaño permitido.";
    if (status === 429) return "Se realizaron demasiados intentos. Esperá un momento y volvé a intentar.";
    if (status >= 500) {
      return "No pudimos completar la operación por un problema interno. Intentá nuevamente en unos minutos.";
    }

    return fallback;
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return fallback;
  }

  if (error instanceof Error) {
    return cleanMessage(error.message) ?? fallback;
  }

  return fallback;
};
