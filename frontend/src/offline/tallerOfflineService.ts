import { API_URL } from "../config/apiConfig";
import { authStorage } from "../services/authStorage";
import { hasAnyRole, WORKSHOP_ROLES } from "../config/permissions";
import type { RefaccionRequest } from "../types/domain.types";
import { syncQueue } from "./syncQueue";
import { backgroundSession } from "./backgroundSession";
import { announceQueueChange, requestBackgroundSync } from "./backgroundSync";
import { syncRepairs } from "./syncEngine";

export const tallerOfflineService = {
  async save(payload: RefaccionRequest) {
    const session = authStorage.get();
    if (!session || session.debeCambiarPassword || !hasAnyRole(session.roles, WORKSHOP_ROLES)) throw new Error("Necesitás una sesión habilitada para registrar trabajos.");
    const id = payload.idOperacionOffline ?? crypto.randomUUID();
    await backgroundSession.set(session);
    await syncQueue.add({
      id,
      owner: session.username,
      apiUrl: API_URL,
      payload: { ...payload, sincronizadoDesdeOffline: payload.sincronizadoDesdeOffline ?? !navigator.onLine, idOperacionOffline: id },
      createdAt: new Date().toISOString(),
      attempts: 0,
      status: "pending",
    });
    announceQueueChange();
    await requestBackgroundSync();
    return id;
  },
  async sync(manual = false) {
    if (!navigator.onLine) return { synced: 0, failed: 0, retryable: false };
    const session = authStorage.get();
    if (!session || session.debeCambiarPassword || !hasAnyRole(session.roles, WORKSHOP_ROLES)) return { synced: 0, failed: 0, retryable: false };
    await backgroundSession.set(session);
    try {
      const result = await syncRepairs(manual);
      if (result.retryable) await requestBackgroundSync();
      return result;
    } finally { announceQueueChange(); }
  },
};
