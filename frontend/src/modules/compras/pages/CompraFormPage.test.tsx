/** @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { clienteService, compraService, parametroService } from "../../../services/api";
import CompraFormPage from "./CompraFormPage";

const authState = vi.hoisted(() => ({ roles: ["VENDEDOR"] as string[] }));
const showMock = vi.hoisted(() => vi.fn());

vi.mock("../../../hooks/useAuth", () => ({
  useAuth: () => ({
    session: {
      token: "token-test",
      username: "usuario-test",
      nombre: "Usuario Test",
      roles: authState.roles,
    },
  }),
}));

vi.mock("../../../shared/feedback/useToast", () => ({
  useToast: () => ({ show: showMock }),
}));

vi.mock("../../../services/api", () => ({
  clienteService: { list: vi.fn() },
  parametroService: { listByCategory: vi.fn() },
  compraService: {
    createWithVehicle: vi.fn(),
    defineDestination: vi.fn(),
    receipt: vi.fn(),
  },
  ventaService: { receipt: vi.fn() },
}));

const clientListMock = vi.mocked(clienteService.list);
const typeListMock = vi.mocked(parametroService.listByCategory);
const createPurchaseMock = vi.mocked(compraService.createWithVehicle);
const defineDestinationMock = vi.mocked(compraService.defineDestination);

function prepareData() {
  clientListMock.mockResolvedValue([
    {
      id: 20,
      nombre: "Ana",
      apellido: "Pérez",
      documento: "12345678",
      tipoCliente: "VENDEDOR",
      activo: true,
    },
  ]);
  typeListMock.mockResolvedValue([
    {
      id: 1,
      categoria: "TIPO_VEHICULO",
      clave: "AUTO",
      valor: "Automóvil",
      descripcion: null,
      activo: true,
    },
  ]);
}

function mockSellerPurchaseResponse() {
  createPurchaseMock.mockResolvedValue({
    id: 30,
    vehiculoId: 10,
    vehiculo: "Toyota Corolla",
    clienteVendedorId: 20,
    clienteVendedor: "Ana Pérez",
    usuarioResponsableId: 4,
    usuarioResponsable: "Vendedor Test",
    fechaCompra: "2026-09-27",
  });
}

function mockManagementPurchaseResponse() {
  createPurchaseMock.mockResolvedValue({
    id: 30,
    vehiculoId: 10,
    vehiculo: "Toyota Corolla",
    clienteVendedorId: 20,
    clienteVendedor: "Ana Pérez",
    usuarioResponsableId: 1,
    usuarioResponsable: "Administrador Test",
    fechaCompra: "2026-09-27",
    costoAdquisicion: 15000,
  });
}

async function registerPurchase() {
  render(
    <MemoryRouter>
      <CompraFormPage />
    </MemoryRouter>,
  );

  await screen.findByRole("option", { name: /Ana Pérez/i });
  fireEvent.change(screen.getByLabelText("Marca"), { target: { value: " Toyota " } });
  fireEvent.change(screen.getByLabelText("Modelo"), { target: { value: " Corolla " } });
  fireEvent.change(screen.getByLabelText(/Matrícula/), { target: { value: " abc123 " } });
  fireEvent.change(screen.getByLabelText("Cliente vendedor"), { target: { value: "20" } });
  fireEvent.change(screen.getByLabelText("Costo de adquisición"), { target: { value: "15000" } });
  fireEvent.click(screen.getByRole("button", { name: "Registrar vehículo y compra" }));

  await screen.findByRole("heading", {
    name: "Vehículo y compra registrados correctamente",
  });
}

afterEach(() => {
  clientListMock.mockReset();
  typeListMock.mockReset();
  createPurchaseMock.mockReset();
  defineDestinationMock.mockReset();
  showMock.mockReset();
  authState.roles = ["VENDEDOR"];
});

describe("CompraFormPage", () => {
  it("crea el vehículo y la compra en una única solicitud", async () => {
    prepareData();
    mockSellerPurchaseResponse();

    await registerPurchase();

    expect(createPurchaseMock).toHaveBeenCalledWith(
      expect.objectContaining({
        vehiculo: expect.objectContaining({
          marca: "Toyota",
          modelo: "Corolla",
          matricula: "ABC123",
        }),
        clienteVendedorId: 20,
        costoAdquisicion: 15000,
      }),
    );
  });

  it("no ofrece el comprobante ni el historial de compras a VENDEDOR", async () => {
    prepareData();
    mockSellerPurchaseResponse();
    authState.roles = ["VENDEDOR"];

    await registerPurchase();

    expect(screen.queryByRole("button", { name: /Descargar comprobante PDF/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Volver a compras" })).not.toBeInTheDocument();
    expect(screen.queryByText(/PDF está disponible/i)).not.toBeInTheDocument();
    expect(screen.getByText("La unidad quedó vinculada a esta compra desde su ingreso.")).toBeInTheDocument();
  });

  it("ofrece el comprobante a ADMINISTRADOR después del alta", async () => {
    prepareData();
    mockManagementPurchaseResponse();
    authState.roles = ["ADMINISTRADOR"];

    await registerPurchase();

    expect(screen.getByRole("button", { name: /Descargar comprobante PDF/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver a compras" })).toBeInTheDocument();
    expect(screen.getByText(/comprobante PDF está disponible/i)).toBeInTheDocument();
  });

  it("permite decidir que el vehículo requiere taller después del registro", async () => {
    prepareData();
    mockSellerPurchaseResponse();
    defineDestinationMock.mockResolvedValue({
      compraId: 30,
      vehiculoId: 10,
      estadoVehiculo: "EN_TALLER",
    });

    await registerPurchase();
    fireEvent.click(screen.getByRole("button", { name: "Requiere taller" }));

    await waitFor(() =>
      expect(defineDestinationMock).toHaveBeenCalledWith(30, "REQUIERE_TALLER"),
    );
    expect(await screen.findByText(/Estado definido: En taller/i)).toBeInTheDocument();
  });
});
