// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import LoginPage from "./LoginPage";

const mocks = vi.hoisted(() => ({
  login: vi.fn<(username: string, password: string) => Promise<void>>(),
  loading: false,
}));

vi.mock("../../../hooks/useAuth", () => ({
  useAuth: () => ({ login: mocks.login, loading: mocks.loading }),
}));

function renderPage(from?: string) {
  return render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: "/login",
          state: from ? { from } : null,
        },
      ]}
    >
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/app" element={<div>Inicio interno</div>} />
        <Route path="/app/vehiculos" element={<div>Inventario</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.loading = false;
  mocks.login.mockResolvedValue();
});

afterEach(() => cleanup());

describe("LoginPage", () => {
  it("valida credenciales obligatorias antes de invocar el servicio", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Ingresar al sistema" }));

    expect(await screen.findByText("Ingresá tu usuario.")).toBeInTheDocument();
    expect(screen.getByText("Ingresá tu contraseña.")).toBeInTheDocument();
    expect(mocks.login).not.toHaveBeenCalled();
  });

  it("envía las credenciales y recupera la ruta protegida solicitada", async () => {
    renderPage("/app/vehiculos");

    fireEvent.change(screen.getByLabelText("Usuario"), {
      target: { value: " vendedor " },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "Clave-segura-2026" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ingresar al sistema" }));

    await waitFor(() =>
      expect(mocks.login).toHaveBeenCalledWith("vendedor", "Clave-segura-2026"),
    );
    expect(await screen.findByText("Inventario")).toBeInTheDocument();
  });

  it("muestra el error devuelto por autenticación sin abandonar el formulario", async () => {
    mocks.login.mockRejectedValue(new Error("Credenciales inválidas"));
    renderPage();

    fireEvent.change(screen.getByLabelText("Usuario"), {
      target: { value: "usuario" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "incorrecta" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ingresar al sistema" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Credenciales inválidas");
    expect(screen.getByRole("button", { name: "Ingresar al sistema" })).toBeInTheDocument();
  });

  it("permite alternar la visibilidad de la contraseña", () => {
    renderPage();

    const password = screen.getByLabelText("Contraseña");
    expect(password).toHaveAttribute("type", "password");

    fireEvent.click(screen.getByRole("button", { name: "Mostrar contraseña" }));
    expect(password).toHaveAttribute("type", "text");

    fireEvent.click(screen.getByRole("button", { name: "Ocultar contraseña" }));
    expect(password).toHaveAttribute("type", "password");
  });
});
