import { dbPromise, type PendingRepair } from "./indexedDb";

export const syncQueue = {
  async add(item: PendingRepair) {
    (await dbPromise).put("repairs", item);
  },
  async list() {
    return (await dbPromise).getAll("repairs");
  },
  async remove(id: string) {
    (await dbPromise).delete("repairs", id);
  },
  async update(item: PendingRepair) {
    (await dbPromise).put("repairs", item);
  },
  async count() {
    return (await dbPromise).count("repairs");
  },
};