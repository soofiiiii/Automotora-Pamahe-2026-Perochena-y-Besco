import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "./AuthProvider";
import { useAuth } from "../hooks/useAuth";

const mockGet = vi.hoisted(() => vi.fn());
const mockClear = vi.hoisted(() => vi.fn());

vi.mock("../services/authStorage", () => ({
  authStorage: {
    get: mockGet,
    clear: mockClear,
    set: vi.fn(),
  },
}));

function AuthStatus() {
  const { isAuthenticated } = useAuth();

  return (
    <div>
      {isAuthenticated ? "Sesión activa" : "Sesión cerrada"}
    </div>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();

  mockGet.mockReturnValue({
    token: "token-test",
    expiresAt: Date.now() + 60_000,
    roles: ["ADMINISTRADOR"],
  });
});

describe("AuthProvider", () => {
  it("cierra la sesión cuando el token expira", () => {
    render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>,
    );

    expect(screen.getByText("Sesión activa")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(mockClear).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Sesión cerrada")).toBeInTheDocument();
  });

  it("cierra la sesión cuando recibe un evento de autorización inválida", () => {
    render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>,
    );

    expect(screen.getByText("Sesión activa")).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new CustomEvent("pamahe:unauthorized"));
    });

    expect(mockClear).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Sesión cerrada")).toBeInTheDocument();
  });
});