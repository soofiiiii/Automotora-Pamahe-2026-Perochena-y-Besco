import { openDB, type DBSchema } from "idb";
import type { RefaccionRequest } from "../types/domain.types";

export interface PendingRepair {
  id: string;
  payload: RefaccionRequest;
  createdAt: string;
  attempts: number;
  lastError?: string;
}

interface PamaheDb extends DBSchema {
  repairs: { key: string; value: PendingRepair };
}

export const dbPromise = openDB<PamaheDb>("pamahe-offline", 1, {
  upgrade(db) {
    db.createObjectStore("repairs", { keyPath: "id" });
  },
});
