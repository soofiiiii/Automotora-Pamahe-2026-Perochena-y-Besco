// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { Role, Usuario } from "../../../types/usuario.types";
import UsuarioFormPage from "./UsuarioFormPage";

const mocks = vi.hoisted(() => ({
  roles: vi.fn<() => Promise<Role[]>>(),
  get: vi.fn<(id: number) => Promise<Usuario>>(),
  create: vi.fn<(body: Record<string, unknown>) => Promise<Usuario>>(),
  update: vi.fn<(id: number, body: Record<string, unknown>) => Promise<Usuario>>(),
  show: vi.fn(),
}));

vi.mock("../../../services/api", () => ({
  usuarioService: {
    roles: mocks.roles,
    get: mocks.get,
    create: mocks.create,
    update: mocks.update,
  },
}));

vi.mock("../../../shared/feedback/useToast", () => ({
  useToast: () => ({ show: mocks.show }),
}));

const user: Usuario = {
  id: 5,
  username: "vendedor",
  email: "vendedor@pamahe.uy",
  nombre: "Vendedor Pamahe",
  telefono: "099123456",
  activo: true,
  roles: ["VENDEDOR"],
};

const roles: Role[] = [
  { id: 1, nombre: "ADMINISTRADOR" },
  { id: 2, nombre: "VENDEDOR" },
];

function renderPage(path = "/app/usuarios/nuevo") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/app/usuarios/nuevo" element={<UsuarioFormPage />} />
        <Route path="/app/usuarios/:id/editar" element={<UsuarioFormPage />} />
        <Route path="/app/usuarios" element={<div>Listado de usuarios</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.roles.mockResolvedValue(roles);
  mocks.get.mockResolvedValue(user);
  mocks.create.mockResolvedValue(user);
  mocks.update.mockResolvedValue(user);
});

afterEach(() => cleanup());

describe("UsuarioFormPage", () => {
  it("crea una cuenta con datos normalizados y al menos un rol", async () => {
    renderPage();

    expect(await screen.findByLabelText("VENDEDOR")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Usuario"), { target: { value: "  Nuevo.Vendedor  " } });
    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "  Nuevo Vendedor  " } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "  NUEVO@PAMAHE.UY  " } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "ClaveSegura2026" } });
    fireEvent.click(screen.getByLabelText("VENDEDOR"));
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(mocks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: "nuevo.vendedor",
          nombre: "Nuevo Vendedor",
          email: "nuevo@pamahe.uy",
          password: "ClaveSegura2026",
          roles: ["VENDEDOR"],
        }),
      ),
    );
    expect(await screen.findByText("Listado de usuarios")).toBeInTheDocument();
  });

  it("rechaza una contraseña inicial que no cumple la longitud mínima", async () => {
    renderPage();
    await screen.findByLabelText("VENDEDOR");

    fireEvent.change(screen.getByLabelText("Usuario"), { target: { value: "nuevo" } });
    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Nuevo Usuario" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "nuevo@pamahe.uy" } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "corta" } });
    fireEvent.click(screen.getByLabelText("VENDEDOR"));
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(mocks.show).toHaveBeenCalledWith(
        "La contraseña debe contener entre 8 y 72 caracteres.",
        "error",
      ),
    );
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("mantiene el nombre de usuario inmutable al editar una cuenta", async () => {
    renderPage("/app/usuarios/5/editar");

    const username = await screen.findByLabelText("Usuario");
    expect(username).toHaveAttribute("readonly");
    expect(username).toHaveValue("vendedor");
    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Vendedor Actualizado" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(mocks.update).toHaveBeenCalledWith(
        5,
        expect.objectContaining({
          nombre: "Vendedor Actualizado",
          email: "vendedor@pamahe.uy",
          roles: ["VENDEDOR"],
          activo: true,
        }),
      ),
    );
    expect(mocks.update.mock.calls[0]?.[1]).not.toHaveProperty("username");
    expect(mocks.update.mock.calls[0]?.[1]).not.toHaveProperty("password");
  });
});
