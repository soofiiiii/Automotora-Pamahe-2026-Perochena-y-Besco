import { API_URL } from "../config/apiConfig";
import { SESSION_IDLE_MINUTES } from "../config/appConfig";
import { hasAnyRole, WORKSHOP_ROLES } from "../config/permissions";
import type { AuthSession } from "../types/auth.types";
import { getOfflineDb } from "./indexedDb";

export const backgroundSession = {
  async set(session: AuthSession) {
    const db = await getOfflineDb();
    if (!hasAnyRole(session.roles, WORKSHOP_ROLES) || session.debeCambiarPassword || !session.expiresAt || session.expiresAt <= Date.now()) {
      await db.delete("auth", "active");
      return;
    }
    await db.put("auth", {
      username: session.username,
      token: session.token,
      apiUrl: API_URL,
      expiresAt: Math.min(session.expiresAt, Date.now() + SESSION_IDLE_MINUTES * 60_000),
    }, "active");
  },
  async get() {
    const db = await getOfflineDb();
    const tx = db.transaction("auth", "readwrite");
    const session = await tx.store.get("active");
    if (session && session.expiresAt <= Date.now()) await tx.store.delete("active");
    await tx.done;
    return session && session.expiresAt > Date.now() ? session : undefined;
  },
  async clear(token?: string) {
    const tx = (await getOfflineDb()).transaction("auth", "readwrite");
    const current = await tx.store.get("active");
    if (!token || current?.token === token) await tx.store.delete("active");
    await tx.done;
  },
};
