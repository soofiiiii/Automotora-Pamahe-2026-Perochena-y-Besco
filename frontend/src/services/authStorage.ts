import { normalizeRoles } from "../config/permissions";
import type { AuthSession, LoginResponse } from "../types/auth.types";

const KEY = "pamahe.auth.v1";
const LEGACY_KEY = "pamahe.auth";

const decodeExp = (token: string) => {
  try {
    const part = token.split(".")[1];
    if (!part) return undefined;
    const raw = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = raw.padEnd(Math.ceil(raw.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded)) as { exp?: number };
    return payload.exp ? payload.exp * 1000 : undefined;
  } catch {
    return undefined;
  }
};

const removeStorageItem = (storage: Storage, key: string) => {
  try {
    storage.removeItem(key);
  } catch {
    // El navegador puede bloquear storage por política o privacidad.
  }
};

const validSession = (value: unknown): value is AuthSession => {
  if (!value || typeof value !== "object") return false;
  const s = value as Partial<AuthSession>;
  return (
    typeof s.token === "string" &&
    s.token.length > 20 &&
    typeof s.username === "string" &&
    Array.isArray(s.roles)
  );
};

export const authStorage = {
  get(): AuthSession | null {
    removeStorageItem(localStorage, LEGACY_KEY);

    let raw: string | null;

    try {
      raw = sessionStorage.getItem(KEY);
    } catch {
      return null;
    }

    if (!raw) return null;

    try {
      const parsed: unknown = JSON.parse(raw);

      if (!validSession(parsed)) {
        throw new Error("Sesión inválida");
      }

      const session: AuthSession = {
        ...parsed,
        roles: normalizeRoles(parsed.roles),
      };

      if (
        !session.roles.length ||
        (session.expiresAt && Date.now() >= session.expiresAt)
      ) {
        removeStorageItem(sessionStorage, KEY);
        return null;
      }

      return session;
    } catch {
      removeStorageItem(sessionStorage, KEY);
      return null;
    }
  },

  set(response: LoginResponse) {
    const roles = normalizeRoles(response.roles);
    if (!roles.length)
      throw new Error(
        "La cuenta no tiene un rol habilitado para esta aplicación.",
      );

    const session: AuthSession = {
      ...response,
      roles,
      expiresAt: decodeExp(response.token),
    };
    try {
      sessionStorage.setItem(KEY, JSON.stringify(session));
    } catch {
      throw new Error(
        "El navegador bloqueó el almacenamiento seguro de la sesión.",
      );
    }
    return session;
  },

  clear() {
    removeStorageItem(sessionStorage, KEY);
    removeStorageItem(localStorage, LEGACY_KEY);
  },
};
