import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";

import { SESSION_IDLE_MINUTES } from "../config/appConfig";
import { authService } from "../services/api";
import { authStorage } from "../services/authStorage";
import type { AuthSession } from "../types/auth.types";

import { AuthContext } from "./authContext";

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(() =>
    authStorage.get(),
  );

  const [loading, setLoading] = useState(false);

  const idleTimer = useRef<number | null>(null);

  const logout = useCallback(() => {
    authStorage.clear();
    setSession(null);
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
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
    },
    [],
  );

  useEffect(() => {
    const handler = () => logout();

    window.addEventListener("pamahe:unauthorized", handler);

    return () => {
      window.removeEventListener("pamahe:unauthorized", handler);
    };
  }, [logout]);

  useEffect(() => {
    if (!session?.expiresAt) return;

    const remaining = session.expiresAt - Date.now();

    const timer = window.setTimeout(
      logout,
      Math.max(0, remaining),
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, [session?.expiresAt, logout]);

  useEffect(() => {
    if (!session) return;

    const resetIdle = () => {
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
      window.addEventListener(event, resetIdle, {
        passive: true,
      });
    });

    resetIdle();

    return () => {
      if (idleTimer.current) {
        window.clearTimeout(idleTimer.current);
      }

      events.forEach((event) => {
        window.removeEventListener(event, resetIdle);
      });
    };
  }, [session, logout]);

  const value = useMemo(
    () => ({
      session,
      loading,
      isAuthenticated: Boolean(session),
      login,
      logout,
    }),
    [session, loading, login, logout],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}