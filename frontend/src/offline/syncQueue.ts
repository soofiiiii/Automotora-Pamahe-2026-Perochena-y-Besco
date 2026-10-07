import { getOfflineDb, type PendingRepair } from "./indexedDb";

export const syncQueue = {
  async add(item: PendingRepair) {
    // add evita reemplazar silenciosamente el payload de una clave idempotente.
    await (await getOfflineDb()).add("repairs", item);
  },
  async list(owner: string, apiUrl: string) {
    return (await (await getOfflineDb()).getAll("repairs"))
      .filter((item) => item.owner === owner && item.apiUrl === apiUrl)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },
   async legacy() {
    return (await (await getOfflineDb()).getAll("repairs")).filter((item) => !item.owner || !item.apiUrl);
  },
  async adoptLegacy(id: string, owner: string, apiUrl: string) {
    const tx = (await getOfflineDb()).transaction("repairs", "readwrite");
    const item = await tx.store.get(id);
    if (item && !item.owner && !item.apiUrl) {
      await tx.store.put({ ...item, owner, apiUrl, status: "pending", payload: { ...item.payload, idOperacionOffline: item.id } });
    }
    await tx.done;
  },
  async remove(id: string, owner: string, apiUrl: string) {
    const tx = (await getOfflineDb()).transaction("repairs", "readwrite");
    const item = await tx.store.get(id);
    if (item?.owner === owner && item.apiUrl === apiUrl) {
      if ((item.leaseUntil ?? 0) > Date.now()) throw new Error("La operación se está enviando. Esperá antes de descartarla.");
      await tx.store.delete(id);
    }
    await tx.done;
  },
  async claim(id: string, owner: string, apiUrl: string, manual: boolean) {
    const tx = (await getOfflineDb()).transaction("repairs", "readwrite");
    const item = await tx.store.get(id);
    if (!item || item.owner !== owner || item.apiUrl !== apiUrl || item.status === "synced" || (item.leaseUntil ?? 0) > Date.now()
      || (!manual && ["conflict", "failed"].includes(item.status ?? "pending"))) {
      await tx.done;
      return null;
    }
    const claimed: PendingRepair = { ...item, status: "syncing", leaseId: crypto.randomUUID(), leaseUntil: Date.now() + 60_000, attempts: item.attempts + 1 };
    await tx.store.put(claimed);
    await tx.done;
    return claimed;
  },
  async finish(item: PendingRepair, result: Pick<PendingRepair, "status" | "lastError" | "syncedAt" | "serverId">) {
    const tx = (await getOfflineDb()).transaction("repairs", "readwrite");
    const current = await tx.store.get(item.id);
    if (current && current.leaseId === item.leaseId) await tx.store.put({ ...current, ...result, leaseId: undefined, leaseUntil: undefined });
    await tx.done;
  },
  async prune() {
    const tx = (await getOfflineDb()).transaction("repairs", "readwrite");
    const rows = await tx.store.getAll();
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    for (const row of rows) if (row.status === "synced" && row.syncedAt && Date.parse(row.syncedAt) < cutoff) await tx.store.delete(row.id);
    await tx.done;
  },
};