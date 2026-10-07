// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { ToastProvider } from "../../../shared/feedback/ToastProvider";
import ReportesPage from "./ReportesPage";

const mocks = vi.hoisted(() => ({
  ventas: vi.fn(),
  compras: vi.fn(),
  stock: vi.fn(),
  vendidos: vi.fn(),
  refacciones: vi.fn(),
  rentabilidad: vi.fn(),
  pdf: vi.fn(),
  exportFile: vi.fn(),
}));

vi.mock("../../../services/api", () => ({
  reporteService: {
    ventas: mocks.ventas,
    compras: mocks.compras,
    stock: mocks.stock,
    vendidos: mocks.vendidos,
    refacciones: mocks.refacciones,
    rentabilidad: mocks.rentabilidad,
    pdf: mocks.pdf,
  },
  exportService: {
    file: mocks.exportFile,
  },
}));

const sales = {
  desde: "2026-09-01",
  hasta: "2026-09-30",
  cantidadVentas: 1,
  ingresos: 15000,
  costoTotal: 12000,
  rentabilidad: 3000,
  ventas: [
    {
      ventaId: 9,
      vehiculoId: 1,
      vehiculo: "Toyota Corolla",
      fechaVenta: "2026-09-20",
      precioFinal: 15000,
      costoTotal: 12000,
      rentabilidad: 3000,
    },
  ],
};

function renderPage() {
  return render(
    <ToastProvider>
      <ReportesPage />
    </ToastProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();

  mocks.ventas.mockResolvedValue(sales);
  mocks.pdf.mockResolvedValue(new Blob(["pdf"], { type: "application/pdf" }));

  mocks.compras.mockResolvedValue({
    desde: "2026-09-01",
    hasta: "2026-09-30",
    cantidadCompras: 0,
    inversionCompras: 0,
    compras: [],
  });

  mocks.stock.mockResolvedValue({
    desde: "2026-09-01",
    hasta: "2026-09-30",
    vehiculosIngresados: 2,
    stockAlCierre: 3,
    disponibles: 2,
    publicados: 1,
    estadoYPublicacionRepresentanSituacionActual: true,
    vehiculos: [],
  });

  mocks.vendidos.mockResolvedValue(sales);

  mocks.refacciones.mockResolvedValue({
    desde: "2026-09-01",
    hasta: "2026-09-30",
    cantidadRefacciones: 0,
    costoRepuestos: 0,
    costoManoObra: 0,
    costoServiciosExternos: 0,
    costoTotal: 0,
    refacciones: [],
  });

  mocks.rentabilidad.mockResolvedValue({
    desde: "2026-09-01",
    hasta: "2026-09-30",
    vehiculosVendidos: 1,
    ingresos: 15000,
    costoTotal: 12000,
    rentabilidad: 3000,
    margenPorcentual: 20,
    operaciones: sales.ventas,
  });
});

afterEach(cleanup);

describe("ReportesPage CF-02", () => {
  it("muestra indicadores y tabla del reporte de ventas", async () => {
    renderPage();

    expect(await screen.findByText("Toyota Corolla")).toBeInTheDocument();

    expect(
      screen.getByText("Operaciones", {
        selector: "span.muted",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Rentabilidad", {
        selector: "span.muted",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("table", {
        name: "Ventas del período",
      }),
    ).toBeInTheDocument();

    expect(mocks.ventas).toHaveBeenCalled();
  });

  it("permite consultar stock y rentabilidad desde la misma interfaz", async () => {
    renderPage();

    await screen.findByText("Toyota Corolla");

    fireEvent.change(screen.getByLabelText("Reporte"), {
      target: { value: "stock" },
    });

    expect(
      await screen.findByText("Stock al cierre"),
    ).toBeInTheDocument();

    expect(mocks.stock).toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Reporte"), {
      target: { value: "rentabilidad" },
    });

    await waitFor(() => {
      expect(mocks.rentabilidad).toHaveBeenCalled();
    });

    expect(
      await screen.findByText("Margen"),
    ).toBeInTheDocument();
  });

  it("rechaza un período invertido sin ejecutar una nueva consulta", async () => {
    renderPage();

    await screen.findByText("Toyota Corolla");

    const initialCalls = mocks.ventas.mock.calls.length;

    fireEvent.change(screen.getByLabelText("Desde"), {
      target: { value: "2026-09-30" },
    });

    fireEvent.change(screen.getByLabelText("Hasta"), {
      target: { value: "2026-09-01" },
    });

    const submitButton = screen.getByRole("button", {
      name: "Consultar período",
    });

    const form = submitButton.closest("form");

    expect(form).not.toBeNull();

    fireEvent.submit(form!);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "La fecha desde no puede ser posterior",
    );

    expect(mocks.ventas).toHaveBeenCalledTimes(initialCalls);
  });

  it("ofrece la descarga PDF del reporte consultado", async () => {
    renderPage();

    await screen.findByText("Toyota Corolla");

    expect(
      screen.getByRole("button", {
        name: "Descargar reporte PDF",
      }),
    ).toBeInTheDocument();
  });

  it("expone el error HTTP y permite reintentar", async () => {
    mocks.ventas
      .mockRejectedValueOnce(new Error("Error 500"))
      .mockResolvedValueOnce(sales);

    renderPage();

    expect(
      await screen.findByText("Error 500"),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: /Reintentar/i,
      }),
    );

    expect(
      await screen.findByText("Toyota Corolla"),
    ).toBeInTheDocument();
  });
});