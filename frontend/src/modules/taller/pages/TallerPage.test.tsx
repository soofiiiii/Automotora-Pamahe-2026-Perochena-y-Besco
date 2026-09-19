import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import TallerPage from "./TallerPage";

const mockList = vi.hoisted(() => vi.fn());
const mockShow = vi.hoisted(() => vi.fn());

vi.mock("../../../services/api", () => ({
  tallerService: {
    list: mockList,
  },
}));

vi.mock("../../../shared/feedback/useToast", () => ({
  useToast: () => ({
    show: mockShow,
  }),
}));

const repairs = [
  {
    id: 1,
    vehiculoId: 10,
    vehiculo: "Toyota Corolla",
    fecha: "2026-09-18",
    tipoTrabajo: "MECANICA",
    descripcion: "Cambio de aceite",
    costoRepuestos: 500,
    costoManoObra: 1000,
    costoServiciosExternos: 0,
    costoTotal: 1500,
    estadoTarea: "PENDIENTE",
  },
  {
    id: 2,
    vehiculoId: 20,
    vehiculo: "Ford Focus",
    fecha: "2026-09-17",
    tipoTrabajo: "PINTURA",
    descripcion: "Reparación de pintura",
    costoRepuestos: 200,
    costoManoObra: 1500,
    costoServiciosExternos: 300,
    costoTotal: 2000,
    estadoTarea: "EN_CURSO",
  },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <TallerPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();

  mockList.mockResolvedValue(repairs);
});

describe("TallerPage", () => {
  it("carga y muestra las tareas del taller", async () => {
    renderPage();

    expect(
      await screen.findByText("Cambio de aceite"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Reparación de pintura"),
    ).toBeInTheDocument();

    expect(screen.getByText("Toyota Corolla")).toBeInTheDocument();
    expect(screen.getByText("Ford Focus")).toBeInTheDocument();

    expect(mockList).toHaveBeenCalledWith(undefined);
  });

  it("filtra las tareas por estado", async () => {
    const user = userEvent.setup();

    mockList.mockImplementation((state?: string) => {
      if (state === "PENDIENTE") {
        return Promise.resolve([repairs[0]]);
      }

      return Promise.resolve(repairs);
    });

    renderPage();

    await screen.findByText("Cambio de aceite");

    const select = screen.getByLabelText("Estado de tarea");

    await user.selectOptions(select, "PENDIENTE");

    await waitFor(() => {
      expect(mockList).toHaveBeenLastCalledWith("PENDIENTE");
    });

    expect(screen.getByText("Cambio de aceite")).toBeInTheDocument();
    expect(
      screen.queryByText("Reparación de pintura"),
    ).not.toBeInTheDocument();
  });

  it("actualiza las tareas al presionar Actualizar", async () => {
    const user = userEvent.setup();

    renderPage();

    await screen.findByText("Cambio de aceite");

    await user.click(
      screen.getByRole("button", { name: /Actualizar/i }),
    );

    await waitFor(() => {
      expect(mockList).toHaveBeenCalledTimes(2);
    });

    expect(mockList).toHaveBeenLastCalledWith(undefined);
  });

  it("muestra un error cuando falla la carga de tareas", async () => {
    mockList.mockRejectedValue(new Error("No se pudo cargar el taller."));

    renderPage();

    await waitFor(() => {
      expect(mockShow).toHaveBeenCalledWith(
        "No se pudo cargar el taller.",
        "error",
      );
    });
  });
});