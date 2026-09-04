import { tallerService } from "../services/api";
import type { RefaccionRequest } from "../types/domain.types";
import { syncQueue } from "./syncQueue";

export const tallerOfflineService = {
  async save(payload: RefaccionRequest) {
    const id = payload.idOperacionOffline ?? crypto.randomUUID();
    await syncQueue.add({
      id,
      payload: {
        ...payload,
        sincronizadoDesdeOffline: true,
        idOperacionOffline: id,
      },
      createdAt: new Date().toISOString(),
      attempts: 0,
    });
    return id;
  },

  async sync() {
    if (!navigator.onLine) return { synced: 0, failed: 0 };
    const items = await syncQueue.list();
    let synced = 0;
    let failed = 0;
    for (const item of items) {
      try {
        await tallerService.create(item.payload);
        await syncQueue.remove(item.id);
        synced += 1;
      } catch (error) {
        failed += 1;
        await syncQueue.update({
          ...item,
          attempts: item.attempts + 1,
          lastError:
            error instanceof Error ? error.message : "Error de sincronización",
        });
      }
    }
    return { synced, failed };
  },
};
