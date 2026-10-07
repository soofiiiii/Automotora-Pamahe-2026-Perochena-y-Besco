// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthSession, CurrentUserResponse, LoginResponse } from "../types/auth.types";
import { SESSION_IDLE_MINUTES } from "../config/appConfig";
import { useAuth } from "../hooks/useAuth";
import { AuthProvider } from "./AuthProvider";

const mocks = vi.hoisted(() => ({
  stored: null as AuthSession | null,
  get: vi.fn<() => AuthSession | null>(),
  set: vi.fn<(response: LoginResponse) => AuthSession>(),
  clear: vi.fn<() => void>(),
  login: vi.fn<(body: { username: string; password: string }) => Promise<LoginResponse>>(),
  me: vi.fn<() => Promise<CurrentUserResponse>>(),
  backgroundSet: vi.fn<() => Promise<void>>(),
  backgroundClear: vi.fn<() => Promise<void>>(),
}));

vi.mock("../services/authStorage", () => ({
  authStorage: {
    get: mocks.get,
    set: mocks.set,
    clear: mocks.clear,
  },
}));

vi.mock("../services/api", () => ({
  authService: {
    login: mocks.login,
    me: mocks.me,
  },
}));

vi.mock("../offline/backgroundSession", () => ({
  backgroundSession: {
    set: mocks.backgroundSet,
    clear: mocks.backgroundClear,
  },
}));

function Probe() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="status">
        {auth.initializing
          ? "initializing"
          : auth.isAuthenticated
            ? `authenticated:${auth.session?.username}`
            : "anonymous"}
      </span>
      <button type="button" onClick={() => void auth.login("  admin  ", "secret")}>Login</button>
      <button type="button" onClick={auth.logout}>Logout</button>
    </div>
  );
}

function renderProvider() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
}

const validSession = (overrides: Partial<AuthSession> = {}): AuthSession => ({
  token: "token-de-prueba-con-longitud-suficiente-123456",
  username: "admin",
  nombre: "Administrador",
  roles: ["ADMINISTRADOR"],
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.stored = null;
  mocks.get.mockImplementation(() => mocks.stored);
  mocks.set.mockImplementation((response) => {
    const previousExpiration = mocks.stored?.expiresAt;
    mocks.stored = {
      ...response,
      ...(previousExpiration ? { expiresAt: previousExpiration } : {}),
    };
    return mocks.stored;
  });
  mocks.clear.mockImplementation(() => {
    mocks.stored = null;
  });
  mocks.login.mockResolvedValue(validSession());
  mocks.me.mockResolvedValue({
    username: "admin",
    nombre: "Administrador",
    roles: ["ADMINISTRADOR"],
    activo: true,
  });
  mocks.backgroundSet.mockResolvedValue();
  mocks.backgroundClear.mockResolvedValue();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("AuthProvider", () => {
  it("revalida una sesión restaurada y actualiza los datos del usuario", async () => {
    mocks.stored = validSession({ username: "nombre-anterior" });
    mocks.me.mockResolvedValue({
      username: "admin.actualizado",
      nombre: "Nombre actualizado",
      roles: ["ROLE_ADMINISTRADOR"],
      activo: true,
      debeCambiarPassword: false,
    });

    renderProvider();

    expect(screen.getByTestId("status")).toHaveTextContent("initializing");
    expect(await screen.findByText("authenticated:admin.actualizado")).toBeInTheDocument();
    expect(mocks.me).toHaveBeenCalledTimes(1);
    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({
        username: "admin.actualizado",
        roles: ["ADMINISTRADOR"],
      }),
    );
  });

  it("autentica, normaliza el usuario de ingreso y persiste la sesión", async () => {
    renderProvider();

    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() =>
      expect(mocks.login).toHaveBeenCalledWith({
        username: "admin",
        password: "secret",
      }),
    );
    expect(await screen.findByText("authenticated:admin")).toBeInTheDocument();
    expect(mocks.set).toHaveBeenCalled();
  });

  it("invalida la sesión cuando el servidor informa que la cuenta quedó inactiva", async () => {
    mocks.stored = validSession();
    mocks.me.mockResolvedValue({
      username: "admin",
      nombre: "Administrador",
      roles: ["ADMINISTRADOR"],
      activo: false,
    });

    renderProvider();

    expect(await screen.findByText("anonymous")).toBeInTheDocument();
    expect(mocks.clear).toHaveBeenCalled();
  });

  it("cierra la sesión al alcanzar la expiración del token", async () => {
    vi.useFakeTimers();
    mocks.login.mockResolvedValue(
      validSession({ expiresAt: Date.now() + 1_000 }),
    );
    renderProvider();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Login" }));
      await Promise.resolve();
    });
    expect(screen.getByTestId("status")).toHaveTextContent("authenticated:admin");

    await act(async () => {
      vi.advanceTimersByTime(1_001);
      await Promise.resolve();
    });

    expect(screen.getByTestId("status")).toHaveTextContent("anonymous");
    expect(mocks.clear).toHaveBeenCalled();
  });

  it("cierra la sesión cuando se supera el período de inactividad", async () => {
    vi.useFakeTimers();
    renderProvider();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Login" }));
      await Promise.resolve();
    });
    expect(screen.getByTestId("status")).toHaveTextContent("authenticated:admin");

    await act(async () => {
      vi.advanceTimersByTime(SESSION_IDLE_MINUTES * 60_000 + 1);
      await Promise.resolve();
    });

    expect(screen.getByTestId("status")).toHaveTextContent("anonymous");
    expect(mocks.clear).toHaveBeenCalled();
  });

  it("atiende una invalidación global de credenciales", async () => {
    renderProvider();
    fireEvent.click(screen.getByRole("button", { name: "Login" }));
    await screen.findByText("authenticated:admin");

    act(() => {
      window.dispatchEvent(new CustomEvent("pamahe:unauthorized"));
    });

    expect(screen.getByTestId("status")).toHaveTextContent("anonymous");
    expect(mocks.clear).toHaveBeenCalled();
  });
});
