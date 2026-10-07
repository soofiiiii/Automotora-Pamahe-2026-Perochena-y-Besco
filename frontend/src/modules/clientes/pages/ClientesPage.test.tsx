// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { PAGE_SIZE } from "../../../config/appConfig";
import type { PageResult } from "../../../types/api.types";
import type { Cliente } from "../../../types/domain.types";
import ClientesPage from "./ClientesPage";

const mocks = vi.hoisted(() => ({
  page: vi.fn<
    (
      params: { q?: string; page?: number; size?: number },
      signal?: AbortSignal,
    ) => Promise<PageResult<Cliente>>
  >(),
  deactivate: vi.fn<(id: number) => Promise<void>>(),
  show: vi.fn(),
  confirm: vi.fn<() => Promise<boolean>>(),
}));

vi.mock("../../../services/api", () => ({
  clienteService: {
    page: mocks.page,
    deactivate: mocks.deactivate,
  },
}));

vi.mock("../../../shared/feedback/useToast", () => ({
  useToast: () => ({ show: mocks.show }),
}));

vi.mock("../../../shared/feedback/useConfirmDialog", () => ({
  useConfirmDialog: () => ({ confirm: mocks.confirm }),
}));

const clients: Cliente[] = [
  {
    id: 1,
    nombre: "María",
    apellido: "Pérez",
    razonSocial: null,
    documento: "12345678",
    telefono: "099123456",
    email: "maria@example.com",
    direccion: null,
    tipoCliente: "COMPRADOR",
    activo: true,
  },
  {
    id: 2,
    nombre: "Carlos",
    apellido: "Suárez",
    razonSocial: null,
    documento: "87654321",
    telefono: null,
    email: null,
    direccion: null,
    tipoCliente: "VENDEDOR",
    activo: true,
  },
];

const pageResult = (
  overrides: Partial<PageResult<Cliente>> = {},
): PageResult<Cliente> => ({
  content: clients,
  number: 0,
  size: PAGE_SIZE,
  totalElements: PAGE_SIZE + 1,
  totalPages: 2,
  serverPaged: true,
  ...overrides,
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <ClientesPage />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mocks.page.mockResolvedValue(pageResult());
  mocks.deactivate.mockResolvedValue();
  mocks.confirm.mockResolvedValue(true);
});

afterEach(() => {
  cleanup();
});

describe("ClientesPage", () => {
  it("carga una página real de clientes sin solicitar el listado completo", async () => {
    renderPage();

    expect(await screen.findByText("María Pérez")).toBeInTheDocument();
    expect(screen.getByText("Carlos Suárez")).toBeInTheDocument();
    expect(mocks.page).toHaveBeenCalledWith(
      { page: 0, size: PAGE_SIZE },
      expect.any(AbortSignal),
    );
  });

  it("envía la búsqueda al servidor y reinicia la página", async () => {
    renderPage();
    await screen.findByText("María Pérez");

    fireEvent.change(screen.getByLabelText("Buscar"), {
      target: { value: "  María  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

    await waitFor(() =>
      expect(mocks.page).toHaveBeenLastCalledWith(
        { q: "María", page: 0, size: PAGE_SIZE },
        expect.any(AbortSignal),
      ),
    );
  });

  it("solicita la página siguiente al backend", async () => {
    mocks.page
      .mockResolvedValueOnce(pageResult())
      .mockResolvedValue(pageResult({ number: 1 }));
    renderPage();
    await screen.findByText("María Pérez");

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    await waitFor(() =>
      expect(mocks.page).toHaveBeenLastCalledWith(
        { page: 1, size: PAGE_SIZE },
        expect.any(AbortSignal),
      ),
    );
  });

  it("presenta exactamente el contenido devuelto por el servidor", async () => {
    renderPage();
    await screen.findByText("María Pérez");

    fireEvent.change(screen.getByLabelText("Buscar"), {
      target: { value: "María" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

    expect(await screen.findByText("Carlos Suárez")).toBeInTheDocument();
  });

  it("recarga la página después de desactivar un cliente", async () => {
    renderPage();
    await screen.findByText("María Pérez");
    const callsBeforeDeactivate = mocks.page.mock.calls.length;

    fireEvent.click(screen.getByRole("button", { name: "Desactivar María" }));

    await waitFor(() => expect(mocks.deactivate).toHaveBeenCalledWith(1));
    await waitFor(() =>
      expect(mocks.page.mock.calls.length).toBeGreaterThan(
        callsBeforeDeactivate,
      ),
    );
    expect(mocks.show).toHaveBeenCalledWith(
      "Cliente desactivado correctamente.",
      "success",
    );
  });
});
