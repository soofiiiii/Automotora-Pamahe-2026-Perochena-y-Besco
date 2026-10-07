import axios from "axios";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";

import { SESSION_IDLE_MINUTES } from "../config/appConfig";
import { normalizeRoles } from "../config/permissions";
import { backgroundSession } from "../offline/backgroundSession";
import { authService } from "../services/api";
import { authStorage } from "../services/authStorage";
import type { AuthSession } from "../types/auth.types";

import { AuthContext } from "./authContext";

const SESSION_REVALIDATION_INTERVAL_MS = 5 * 60_000;

export function AuthProvider({ children }: PropsWithChildren) {
  const [restoredSession] = useState<AuthSession | null>(() =>
    authStorage.get(),
  );
  const [session, setSession] = useState<AuthSession | null>(restoredSession);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(Boolean(restoredSession));
  const idleTimer = useRef<number | null>(null);
  const revalidationInFlight = useRef<Promise<void> | null>(null);
  const latestSession = useRef<AuthSession | null>(session);

  useEffect(() => {
    latestSession.current = session;
  }, [session]);

  const logout = useCallback(() => {
    const token = authStorage.get()?.token;
    void backgroundSession.clear(token).catch(() => undefined);
    authStorage.clear();
    setSession(null);
    setInitializing(false);
  }, []);

  const revalidateSession = useCallback(async () => {
    if (revalidationInFlight.current) {
      return revalidationInFlight.current;
    }

    const current = authStorage.get();

    if (!current) {
      setSession(null);
      setInitializing(false);
      return;
    }

    const tokenBeingValidated = current.token;

    const isStillCurrentSession = () =>
      authStorage.get()?.token === tokenBeingValidated;

    const task = (async () => {
      try {
        const currentUser = await authService.me();

        // La sesión pudo haberse cerrado o reemplazado mientras /auth/me
        // estaba en curso. Una respuesta antigua nunca debe restaurarla.
        if (!isStillCurrentSession()) {
          return;
        }

        const roles = normalizeRoles(currentUser.roles);

        if (currentUser.activo === false || roles.length === 0) {
          logout();
          return;
        }

        const refreshed = authStorage.set({
          token: tokenBeingValidated,
          username: currentUser.username,
          nombre: currentUser.nombre,
          roles,
          debeCambiarPassword: currentUser.debeCambiarPassword,
        });

        setSession(refreshed);
      } catch (error) {
        // Una respuesta de una sesión antigua tampoco debe cerrar
        // una sesión nueva que haya sido iniciada mientras tanto.
        if (!isStillCurrentSession()) {
          return;
        }

        if (
          axios.isAxiosError(error) &&
          (error.response?.status === 401 ||
            (error.response?.status === 403 &&
              error.response?.data?.codigo !== "PASSWORD_CHANGE_REQUIRED"))
        ) {
          logout();
        }

        // Ante fallos temporales de red se conserva la sesión actual.
      } finally {
        setInitializing(false);
        revalidationInFlight.current = null;
      }
    })();

    revalidationInFlight.current = task;
    return task;
  }, [logout]);

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);

    try {
      const result = await authService.login({
        username: username.trim(),
        password,
      });

      setSession(authStorage.set(result));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!restoredSession) return;

    const timeoutId = window.setTimeout(() => {
      void revalidateSession();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [restoredSession, revalidateSession]);

  useEffect(() => {
    if (!session) return;

    const onFocus = () => {
      void revalidateSession();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void revalidateSession();
      }
    };
    const interval = window.setInterval(
      () => void revalidateSession(),
      SESSION_REVALIDATION_INTERVAL_MS,
    );

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [session, revalidateSession]);

  useEffect(() => {
    const handler = () => logout();

    window.addEventListener("pamahe:unauthorized", handler);

    return () => {
      window.removeEventListener("pamahe:unauthorized", handler);
    };
  }, [logout]);

  useEffect(() => {
    const handler = () =>
      setSession((current) =>
        current
          ? authStorage.set({ ...current, debeCambiarPassword: true })
          : null,
      );
    window.addEventListener("pamahe:password-required", handler);
    return () =>
      window.removeEventListener("pamahe:password-required", handler);
  }, []);

  useEffect(() => {
    if (!session?.expiresAt) return;

    const remaining = session.expiresAt - Date.now();
    const timer = window.setTimeout(logout, Math.max(0, remaining));

    return () => {
      window.clearTimeout(timer);
    };
  }, [session?.expiresAt, logout]);

  const sessionToken = session?.token;

  useEffect(() => {
    if (!sessionToken) return;

    let lastBackgroundUpdate = 0;

    const resetIdle = () => {
      const currentSession = latestSession.current;

      if (!currentSession) {
        return;
      }

      const now = Date.now();

      if (now - lastBackgroundUpdate > 10_000) {
        lastBackgroundUpdate = now;
        void backgroundSession.set(currentSession).catch(() => undefined);
      }

      if (idleTimer.current) {
        window.clearTimeout(idleTimer.current);
      }

      idleTimer.current = window.setTimeout(() => {
        logout();

        window.dispatchEvent(
          new CustomEvent("pamahe:toast", {
            detail: {
              type: "info",
              message:
                "La sesión se cerró por inactividad para proteger la información.",
            },
          }),
        );
      }, SESSION_IDLE_MINUTES * 60_000);
    };

    const events: Array<keyof WindowEventMap> = [
      "pointerdown",
      "keydown",
      "scroll",
    ];

    events.forEach((event) => {
      window.addEventListener(event, resetIdle, { passive: true });
    });

    resetIdle();

    return () => {
      if (idleTimer.current) {
        window.clearTimeout(idleTimer.current);
        idleTimer.current = null;
      }

      events.forEach((event) => {
        window.removeEventListener(event, resetIdle);
      });
    };
  }, [sessionToken, logout]);

  const value = useMemo(
    () => ({
      session,
      loading,
      initializing,
      isAuthenticated: Boolean(session),
      login,
      logout,
    }),
    [session, loading, initializing, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
