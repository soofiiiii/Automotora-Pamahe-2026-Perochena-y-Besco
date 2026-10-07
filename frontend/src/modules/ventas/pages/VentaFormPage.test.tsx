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
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { Cliente, Venta } from "../../../types/domain.types";
import type { Vehiculo } from "../../../types/vehiculo.types";
import VentaFormPage from "./VentaFormPage";

const mocks = vi.hoisted(() => ({
  vehicles: vi.fn<() => Promise<Vehiculo[]>>(),
  clients: vi.fn<() => Promise<Cliente[]>>(),
  create: vi.fn<(body: Record<string, unknown>) => Promise<Venta>>(),
  show: vi.fn(),
}));

vi.mock("../../../services/api", () => ({
  vehiculoService: { list: mocks.vehicles },
  clienteService: { list: mocks.clients },
  ventaService: { create: mocks.create },
}));

vi.mock("../../../shared/feedback/useToast", () => ({
  useToast: () => ({ show: mocks.show }),
}));

const availableVehicle: Vehiculo = {
  id: 5,
  marca: "Toyota",
  modelo: "Corolla",
  tipoVehiculoLabel: null,
  anio: 2021,
  matricula: "ABC1234",
  estado: "DISPONIBLE",
  ubicacionActual: "LOCAL",
  activo: true,
};

const reservedVehicle: Vehiculo = {
  ...availableVehicle,
  id: 6,
  modelo: "Yaris",
  estado: "RESERVADO",
  ubicacionActual: "LOCAL",
};

const soldVehicle: Vehiculo = {
  ...availableVehicle,
  id: 7,
  modelo: "Etios",
  estado: "VENDIDO",
  ubicacionActual: "LOCAL",
};

const buyer: Cliente = {
  id: 9,
  nombre: "Lucía",
  apellido: "Suárez",
  documento: "45678901",
  tipoCliente: "COMPRADOR",
  activo: true,
};

const seller: Cliente = {
  ...buyer,
  id: 10,
  nombre: "Martín",
  tipoCliente: "VENDEDOR",
};

const sale: Venta = {
  id: 20,
  vehiculoId: 5,
  vehiculo: "Toyota Corolla",
  clienteCompradorId: 9,
  clienteComprador: "Lucía Suárez",
  fechaVenta: "2026-09-27",
  precioFinal: 980000,
  medioPago: "TRANSFERENCIA",
  entidadFinanciera: null,
  montoFinanciado: null,
  estadoFinanciacion: null,
  canalOrigen: "PRESENCIAL",
  seguimientoPostventaRealizado: false,
  datosCompradorVerificados: true,
  documentacionRevisada: true,
  cobroConfirmado: true,
  proximoMantenimiento: null,
  estadoComprobante: "PENDIENTE",
  intentosComprobante: 0,
  ultimoIntentoComprobante: null,
  proximoIntentoComprobante: null,
};

function confirmChecklist() {
  fireEvent.click(screen.getByLabelText("Datos del comprador verificados"));
  fireEvent.click(screen.getByLabelText("Documentación revisada"));
  fireEvent.click(screen.getByLabelText("Cobro confirmado"));
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/app/ventas/nueva"]}>
      <Routes>
        <Route path="/app/ventas/nueva" element={<VentaFormPage />} />
        <Route path="/app/ventas/:id" element={<div>Detalle de venta</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.vehicles.mockResolvedValue([availableVehicle, reservedVehicle, soldVehicle]);
  mocks.clients.mockResolvedValue([buyer, seller]);
  mocks.create.mockResolvedValue(sale);
});

afterEach(() => cleanup());

describe("VentaFormPage", () => {
  it("ofrece únicamente vehículos vendibles y clientes compradores", async () => {
    renderPage();

    expect(
      await screen.findByRole("option", { name: /Toyota Corolla/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: /Toyota Yaris/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: /Toyota Etios/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /Lucía Suárez/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: /Martín/ }),
    ).not.toBeInTheDocument();
  });

  it("muestra y envía los datos adicionales cuando el medio de pago es financiación", async () => {
    renderPage();
    await screen.findByRole("option", { name: /Toyota Corolla/ });

    fireEvent.change(screen.getByLabelText("Vehículo"), { target: { value: "5" } });
    fireEvent.change(screen.getByLabelText("Cliente comprador"), { target: { value: "9" } });
    fireEvent.change(screen.getByLabelText("Precio final"), { target: { value: "980000" } });
    fireEvent.change(screen.getByLabelText("Medio de pago"), { target: { value: "FINANCIACION_BANCARIA" } });

    expect(screen.getByLabelText("Entidad financiera")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Entidad financiera"), { target: { value: "BROU" } });
    fireEvent.change(screen.getByLabelText("Monto financiado"), { target: { value: "600000" } });
    fireEvent.change(screen.getByLabelText("Estado de financiación"), { target: { value: "APROBADA" } });
    fireEvent.change(screen.getByLabelText("Origen del contacto"), { target: { value: "WHATSAPP" } });
    confirmChecklist();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar venta" }));

    await waitFor(() =>
      expect(mocks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          medioPago: "FINANCIACION_BANCARIA",
          entidadFinanciera: "BROU",
          montoFinanciado: 600000,
          estadoFinanciacion: "APROBADA",
          canalOrigen: "WHATSAPP",
        }),
      ),
    );
  });

  it("registra la venta y navega a su detalle", async () => {
    renderPage();
    await screen.findByRole("option", { name: /Toyota Corolla/ });

    fireEvent.change(screen.getByLabelText("Vehículo"), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByLabelText("Cliente comprador"), {
      target: { value: "9" },
    });
    fireEvent.change(screen.getByLabelText("Precio final"), {
      target: { value: "980000" },
    });
    confirmChecklist();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar venta" }));

    await waitFor(() =>
      expect(mocks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          vehiculoId: 5,
          clienteCompradorId: 9,
          precioFinal: 980000,
          medioPago: "TRANSFERENCIA",
          canalOrigen: "PRESENCIAL",
        }),
      ),
    );
    expect(mocks.show).toHaveBeenCalledWith(
      "Venta registrada correctamente. El vehículo quedó marcado como vendido.",
      "success",
    );
    expect(await screen.findByText("Detalle de venta")).toBeInTheDocument();
  });
});
