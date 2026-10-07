import { openDB, type DBSchema } from "idb";
import type { RefaccionRequest } from "../types/domain.types";
import type { VehiculoBase } from "../types/vehiculo.types";

export type SyncStatus = "pending" | "syncing" | "retry" | "auth_required" | "conflict" | "failed" | "synced";

export interface PendingRepair {
  id: string;
  payload: RefaccionRequest;
  createdAt: string;
  attempts: number;
  owner?: string;
  apiUrl?: string;
  status?: SyncStatus;
  lastError?: string;
  leaseId?: string;
  leaseUntil?: number;
  syncedAt?: string;
  serverId?: number;
}

export interface BackgroundSession {
  username: string;
  token: string;
  expiresAt: number;
  apiUrl: string;
}

interface PamaheDb extends DBSchema {
  repairs: { key: string; value: PendingRepair };
  auth: { key: string; value: BackgroundSession };
  vehicles: { key: string; value: { updatedAt: string; rows: VehiculoBase[] } };
}

let connection: ReturnType<typeof openDB<PamaheDb>> | undefined;
export function getOfflineDb() {
  connection ??= openDB<PamaheDb>("pamahe-offline", 2, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("repairs")) db.createObjectStore("repairs", { keyPath: "id" });
      if (!db.objectStoreNames.contains("auth")) db.createObjectStore("auth");
      if (!db.objectStoreNames.contains("vehicles")) db.createObjectStore("vehicles");
    },
    blocking() { void connection?.then((db) => db.close()); connection = undefined; },
    terminated() { connection = undefined; },
  });
  return connection;
}
