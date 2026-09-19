import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import LoginPage from "./LoginPage";
import { AuthContext } from "../../../contexts/authContext";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderLogin(
  login = vi.fn().mockResolvedValue(undefined),
  loading = false,
) {
  return render(
    <AuthContext.Provider
      value={{
        login,
        loading,
      } as never}
    >
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

beforeEach(() => {
  mockNavigate.mockClear();
});

describe("LoginPage", () => {
  it("permite iniciar sesión con credenciales válidas", async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockResolvedValue(undefined);

    renderLogin(login);

    await user.type(screen.getByLabelText("Usuario"), "admin");
    await user.type(screen.getByLabelText("Contraseña"), "123456");

    await user.click(screen.getByRole("button", { name: "Ingresar al sistema" }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith("admin", "123456");
      expect(mockNavigate).toHaveBeenCalledWith("/app", { replace: true });
    });
  });

  it("muestra errores de validación cuando los campos están vacíos", async () => {
    const user = userEvent.setup();

    renderLogin();

    await user.click(
      screen.getByRole("button", { name: "Ingresar al sistema" }),
    );

    expect(await screen.findByText("Ingresá tu usuario")).toBeInTheDocument();
    expect(
      await screen.findByText("Ingresá tu contraseña"),
    ).toBeInTheDocument();
  });

  it("muestra el error cuando el login es rechazado", async () => {
    const user = userEvent.setup();
    const login = vi
      .fn()
      .mockRejectedValue(new Error("Usuario o contraseña incorrectos."));

    renderLogin(login);

    await user.type(screen.getByLabelText("Usuario"), "admin");
    await user.type(screen.getByLabelText("Contraseña"), "incorrecta");

    await user.click(screen.getByRole("button", { name: "Ingresar al sistema" }));

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent("Usuario o contraseña incorrectos.");

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("permite mostrar y ocultar la contraseña", async () => {
    const user = userEvent.setup();

    renderLogin();

    const passwordInput = screen.getByLabelText("Contraseña");
    const toggleButton = screen.getByRole("button", {
      name: "Mostrar contraseña",
    });

    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(toggleButton);

    expect(passwordInput).toHaveAttribute("type", "text");
    expect(
      screen.getByRole("button", { name: "Ocultar contraseña" }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Ocultar contraseña" }),
    );

    expect(passwordInput).toHaveAttribute("type", "password");
  });
});