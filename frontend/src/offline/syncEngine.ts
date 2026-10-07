import { API_URL } from "../config/apiConfig";
import { backgroundSession } from "./backgroundSession";
import { syncQueue } from "./syncQueue";
import type { SyncStatus } from "./indexedDb";

export interface SyncResult { synced: number; failed: number; retryable: boolean; }

export function failureStatus(status: number): SyncStatus {
  if (status === 401 || status === 403) return "auth_required";
  if (status === 409) return "conflict";
  if (status === 408 || status === 429 || status >= 500) return "retry";
  return "failed";
}

function confirmationId(value: unknown, operationId: string): number | undefined {
  if (!value || typeof value !== "object") return undefined;
  const body = "data" in value ? value.data : value;
  if ("ok" in value && value.ok === false) return undefined;
  if (!body || typeof body !== "object" || !("id" in body) || typeof body.id !== "number" || !Number.isSafeInteger(body.id) || body.id <= 0) return undefined;
  if (!("idOperacionOffline" in body) || body.idOperacionOffline !== operationId) return undefined;
  return body.id;
}

/** Usado por ventana y Service Worker; no depende de React, Axios ni sessionStorage. */
export async function syncRepairs(manual = false): Promise<SyncResult> {
  const result: SyncResult = { synced: 0, failed: 0, retryable: false };
  const initial = await backgroundSession.get();
  if (!initial || initial.apiUrl !== API_URL) return result;
  await syncQueue.prune();
  const rows = await syncQueue.list(initial.username, API_URL);
  for (const row of rows) {
    const session = await backgroundSession.get();
    if (!session || session.token !== initial.token || session.username !== initial.username || session.apiUrl !== API_URL) break;
    const item = await syncQueue.claim(row.id, session.username, API_URL, manual);
    if (!item) continue;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch(`${API_URL}/taller/refacciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${session.token}` },
        body: JSON.stringify(item.payload),
        signal: controller.signal,
        credentials: "omit",
        cache: "no-store",
        redirect: "error",
      });
      if (!response.ok) {
        const status = failureStatus(response.status);
        const message = status === "auth_required"
          ? "La sesión ya no permite enviar esta refacción. Iniciá sesión nuevamente y revisá si debés cambiar tu contraseña."
          : status === "conflict"
            ? "La refacción entra en conflicto con información ya registrada. Revisá el trabajo antes de volver a enviarlo."
            : status === "retry"
              ? "No pudimos confirmar el envío. La refacción quedó guardada y se volverá a intentar."
              : "No pudimos registrar la refacción. Revisá la fecha, el vehículo, el responsable y el estado de la tarea.";
        await syncQueue.finish(item, { status, lastError: message });
        result.failed += 1;
        result.retryable ||= status === "retry";
        if (status === "auth_required") { await backgroundSession.clear(session.token); break; }
        if (status === "retry") break;
        continue;
      }
      const serverId = confirmationId(await response.json(), item.id);
      if (!serverId) throw new Error("Respuesta sin confirmación idempotente");
      await syncQueue.finish(item, { status: "synced", serverId, syncedAt: new Date().toISOString(), lastError: undefined });
      result.synced += 1;
    } catch {
      await syncQueue.finish(item, { status: "retry", lastError: "No recibimos confirmación del envío. La refacción sigue guardada y se volverá a intentar sin duplicarla." });
      result.failed += 1;
      result.retryable = true;
      break;
    } finally { clearTimeout(timer); }
  }
  const active = await backgroundSession.get();
  if (active?.token === initial.token) {
    const pending = await syncQueue.list(initial.username, API_URL);
    result.retryable ||= pending.some((item) => ["pending", "retry", "syncing"].includes(item.status ?? "pending"));
  }
  return result;
}
