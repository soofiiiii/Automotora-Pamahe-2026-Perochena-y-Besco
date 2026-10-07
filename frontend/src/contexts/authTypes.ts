import type { AuthSession } from "../types/auth.types";

export interface AuthContextValue {
  session: AuthSession | null;
  loading: boolean;
  initializing: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}
