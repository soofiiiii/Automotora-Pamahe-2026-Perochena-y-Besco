// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { Cliente } from "../../../types/domain.types";
import ClienteFormPage from "./ClienteFormPage";

const mocks = vi.hoisted(() => ({
  get: vi.fn<(id: number) => Promise<Cliente>>(),
  create: vi.fn<(body: Record<string, unknown>) => Promise<Cliente>>(),
  update: vi.fn<(id: number, body: Record<string, unknown>) => Promise<Cliente>>(),
  findByDocument: vi.fn<(documento: string, signal?: AbortSignal) => Promise<Cliente | null>>(),
  show: vi.fn(),
}));

vi.mock("../../../services/api", () => ({
  clienteService: {
    get: mocks.get,
    create: mocks.create,
    update: mocks.update,
    findByDocument: mocks.findByDocument,
  },
}));

vi.mock("../../../shared/feedback/useToast", () => ({
  useToast: () => ({ show: mocks.show }),
}));

const client: Cliente = {
  id: 8,
  nombre: "Ana",
  apellido: "Pérez",
  documento: "45678901",
  telefono: "099111222",
  email: "ana@example.com",
  direccion: "Colonia 123",
  tipoCliente: "AMBOS",
  activo: true,
};

function renderPage(path = "/app/clientes/nuevo") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/app/clientes/nuevo" element={<ClienteFormPage />} />
        <Route path="/app/clientes/:id/editar" element={<ClienteFormPage />} />
        <Route path="/app/clientes" element={<div>Listado de clientes</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.get.mockResolvedValue(client);
  mocks.create.mockResolvedValue(client);
  mocks.update.mockResolvedValue(client);
  mocks.findByDocument.mockResolvedValue(null);
});

afterEach(() => cleanup());

describe("ClienteFormPage", () => {
  it("impide guardar datos que no cumplen las validaciones principales", async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Ana" } });
    fireEvent.change(screen.getByLabelText("Documento"), { target: { value: "12" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "correo-invalido" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cliente" }));

    expect(await screen.findByText("Ingresá un documento válido.")).toBeInTheDocument();
    expect(screen.getByText("Ingresá un email válido.")).toBeInTheDocument();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("registra un cliente válido y vuelve al listado", async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "  Ana  " } });
    fireEvent.change(screen.getByLabelText("Apellido"), { target: { value: "Pérez" } });
    fireEvent.change(screen.getByLabelText("Documento"), { target: { value: "45678901" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ana@example.com" } });
    fireEvent.change(screen.getByLabelText("Tipo"), { target: { value: "AMBOS" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cliente" }));

    await waitFor(() =>
      expect(mocks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: "Ana",
          documento: "45678901",
          email: "ana@example.com",
          tipoCliente: "AMBOS",
        }),
      ),
    );
    expect(mocks.show).toHaveBeenCalledWith("Cliente creado correctamente.", "success");
    expect(await screen.findByText("Listado de clientes")).toBeInTheDocument();
  });

  it("advierte un documento duplicado sin bloquear el alta", async () => {
    mocks.findByDocument.mockResolvedValue(client);
    renderPage();

    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Otra Ana" } });
    fireEvent.change(screen.getByLabelText("Documento"), { target: { value: "45678901" } });

    expect(await screen.findByText("Ya existe un cliente con este documento.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Guardar cliente" }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalled());
  });

  it("carga y actualiza un cliente existente", async () => {
    renderPage("/app/clientes/8/editar");

    expect(await screen.findByDisplayValue("Ana")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Teléfono"), {
      target: { value: "098222333" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cliente" }));

    await waitFor(() =>
      expect(mocks.update).toHaveBeenCalledWith(
        8,
        expect.objectContaining({ telefono: "098222333" }),
      ),
    );
  });
});
