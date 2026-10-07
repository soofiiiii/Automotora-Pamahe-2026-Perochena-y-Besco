import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DashboardData } from "../../../types/domain.types";
import DashboardPage from "./DashboardPage";

const mocks = vi.hoisted(() => ({
  get: vi.fn<(desde?: string, hasta?: string) => Promise<DashboardData>>(),
}));

vi.mock("../../../services/api", () => ({
  dashboardService: {
    get: mocks.get,
  },
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  PieChart: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Pie: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Cell: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

const dashboard = (overrides: Partial<DashboardData> = {}): DashboardData => ({
  vehiculosActivos: 12,
  vehiculosEnTaller: 2,
  vehiculosDisponibles: 6,
  vehiculosVendidos: 4,
  tareasTallerPendientes: 7,
  clientesActivos: 18,
  ventasRegistradas: 9,
  ingresosVentas: 1_350_000,
  rentabilidadAcumulada: 240_000,
  vehiculosPorEstado: {
    DISPONIBLE: 6,
    EN_TALLER: 2,
    VENDIDO: 4,
  },
  periodoDesde: null,
  periodoHasta: null,
  ventasPeriodo: 3,
  ingresosPeriodo: 480_000,
  rentabilidadPeriodo: 92_000,
  inversionActualRefacciones: 54_000,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.get.mockResolvedValue(dashboard());
});

afterEach(() => cleanup());

describe("DashboardPage", () => {
  it("carga y presenta los indicadores gerenciales devueltos por la API", async () => {
    render(<DashboardPage />);

    expect(screen.getByText("Cargando indicadores…")).toBeInTheDocument();
    expect(await screen.findByText("Situación operativa")).toBeInTheDocument();

    expect(mocks.get).toHaveBeenCalledWith(undefined, undefined);
    expect(screen.getByText("Vehículos activos").closest("article")).toHaveTextContent("12");
    expect(screen.getByText("Tareas pendientes").closest("article")).toHaveTextContent("7");
    expect(screen.getByText("Ventas registradas").closest(".detail-item")).toHaveTextContent("9");
    expect(screen.getByText("Ventas del período").closest("article")).toHaveTextContent("3");
    expect(screen.getByText("Mostrando información general acumulada.")).toBeInTheDocument();
  });

  it("envía desde/hasta al backend y refleja el período consultado", async () => {
    render(<DashboardPage />);
    await screen.findByText("Situación operativa");

    mocks.get.mockResolvedValueOnce(
      dashboard({
        periodoDesde: "2026-09-01",
        periodoHasta: "2026-09-30",
        ventasPeriodo: 5,
      }),
    );

    fireEvent.change(screen.getByLabelText("Desde"), {
      target: { value: "2026-09-01" },
    });
    fireEvent.change(screen.getByLabelText("Hasta"), {
      target: { value: "2026-09-30" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar período" }));

    await waitFor(() =>
      expect(mocks.get).toHaveBeenLastCalledWith("2026-09-01", "2026-09-30"),
    );

    expect(await screen.findByText("2026-09-01")).toBeInTheDocument();
    expect(screen.getByText("2026-09-30")).toBeInTheDocument();
    expect(screen.getByText("Ventas del período").closest("article")).toHaveTextContent("5");
  });

  it("rechaza un rango de fechas invertido sin consultar nuevamente la API", async () => {
    render(<DashboardPage />);
    await screen.findByText("Situación operativa");

    fireEvent.change(screen.getByLabelText("Desde"), {
      target: { value: "2026-10-01" },
    });
    fireEvent.change(screen.getByLabelText("Hasta"), {
      target: { value: "2026-09-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar período" }));

    expect(
      screen.getByText("La fecha desde no puede ser posterior a la fecha hasta."),
    ).toBeInTheDocument();
    expect(mocks.get).toHaveBeenCalledTimes(1);
  });

  it("muestra un error de API sin dejar datos inconsistentes en pantalla", async () => {
    mocks.get.mockRejectedValueOnce(new Error("Fallo controlado del dashboard"));

    render(<DashboardPage />);

    expect(await screen.findByText("Fallo controlado del dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Indicadores generales")).not.toBeInTheDocument();
  });
});
