// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { Venta } from "../../../types/domain.types";
import VentaDetailPage from "./VentaDetailPage";

const mocks = vi.hoisted(() => ({
  get: vi.fn<(id: number) => Promise<Venta>>(),
  gerencial: vi.fn(),
  updateFinancing: vi.fn(),
  updateMaintenance: vi.fn(),
  markPostSaleFollowUp: vi.fn(),
  show: vi.fn(),
}));

vi.mock("../../../hooks/useAuth", () => ({
  useAuth: () => ({ session: { roles: ["VENDEDOR"] } }),
}));

vi.mock("../../../services/api", () => ({
  ventaService: {
    get: mocks.get,
    gerencial: mocks.gerencial,
    updateFinancing: mocks.updateFinancing,
    updateMaintenance: mocks.updateMaintenance,
    markPostSaleFollowUp: mocks.markPostSaleFollowUp,
  },
}));

vi.mock("../../../shared/components/ReceiptDownloadButton", () => ({
  ReceiptDownloadButton: () => <button type="button">Comprobante</button>,
}));

vi.mock("../../../shared/feedback/useToast", () => ({
  useToast: () => ({ show: mocks.show }),
}));

const financedSale: Venta = {
  id: 20,
  vehiculoId: 5,
  vehiculo: "Toyota Corolla 2021",
  clienteCompradorId: 9,
  clienteComprador: "Lucía Suárez",
  vendedorId: 3,
  vendedor: "Vendedor",
  fechaVenta: "2026-09-27",
  precioFinal: 980000,
  medioPago: "FINANCIACION_BANCARIA",
  entidadFinanciera: "BROU",
  montoFinanciado: 600000,
  estadoFinanciacion: "PENDIENTE",
  canalOrigen: "WHATSAPP",
  seguimientoPostventaRealizado: false,
  datosCompradorVerificados: true,
  documentacionRevisada: true,
  cobroConfirmado: true,
  proximoMantenimiento: null,
  estadoComprobante: "GENERADO",
  intentosComprobante: 1,
  ultimoIntentoComprobante: "2026-09-27T12:00:00",
  proximoIntentoComprobante: null,
  comprobanteUrl: "/api/ventas/20/comprobante",
  observaciones: null,
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/app/ventas/20"]}>
      <Routes>
        <Route path="/app/ventas/:id" element={<VentaDetailPage />} />
        <Route path="/app/ventas" element={<div>Ventas</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.get.mockResolvedValue(financedSale);
  mocks.updateFinancing.mockImplementation(async (_id, body) => ({
    ...financedSale,
    entidadFinanciera: body.entidadFinanciera,
    montoFinanciado: body.montoFinanciado,
    estadoFinanciacion: body.estado,
  }));
  mocks.updateMaintenance.mockImplementation(async (_id, body) => ({
    ...financedSale,
    proximoMantenimiento: body.proximoMantenimiento,
  }));
  mocks.markPostSaleFollowUp.mockResolvedValue({
    ...financedSale,
    seguimientoPostventaRealizado: true,
  });
});

afterEach(() => cleanup());

describe("VentaDetailPage", () => {
  it("muestra medio de pago, canal y datos básicos de financiación", async () => {
    renderPage();

    expect(await screen.findByText("Financiación bancaria")).toBeInTheDocument();
    expect(screen.getByText("WhatsApp")).toBeInTheDocument();
    expect(screen.getByDisplayValue("BROU")).toBeInTheDocument();
    expect(screen.getByDisplayValue("600000")).toBeInTheDocument();
  });

  it("permite actualizar el estado de financiación", async () => {
    renderPage();
    await screen.findByDisplayValue("BROU");

    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "APROBADA" } });
    fireEvent.click(screen.getByRole("button", { name: "Actualizar financiación" }));

    await waitFor(() =>
      expect(mocks.updateFinancing).toHaveBeenCalledWith(20, {
        entidadFinanciera: "BROU",
        montoFinanciado: 600000,
        estado: "APROBADA",
      }),
    );
  });

  it("permite cerrar el seguimiento postventa pendiente", async () => {
    renderPage();
    await screen.findByText("Pendiente", { selector: "strong" });

    fireEvent.click(screen.getByRole("button", { name: "Marcar seguimiento como realizado" }));

    await waitFor(() => expect(mocks.markPostSaleFollowUp).toHaveBeenCalledWith(20));
    expect(mocks.show).toHaveBeenCalledWith(
      "Seguimiento postventa marcado como realizado.",
      "success",
    );
  });
});
