import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AuditoriaPage from "./AuditoriaPage";

const mockList = vi.hoisted(() => vi.fn());
const mockShow = vi.hoisted(() => vi.fn());

vi.mock("../../../services/api", () => ({
  auditoriaService: {
    list: mockList,
  },
}));

vi.mock("../../../shared/feedback/useToast", () => ({
  useToast: () => ({
    show: mockShow,
  }),
}));

const auditRows = [
  {
    id: 1,
    creadoEn: "2026-09-18T10:30:00",
    usuario: "admin",
    accion: "CREAR",
    entidad: "VEHICULO",
    entidadId: 15,
    detalle: "Vehículo creado",
  },
  {
    id: 2,
    creadoEn: "2026-09-18T11:00:00",
    usuario: "vendedor",
    accion: "ACTUALIZAR",
    entidad: "VENTA",
    entidadId: 8,
    detalle: "Venta actualizada",
  },
];

function renderPage() {
  return render(<AuditoriaPage />);
}

beforeEach(() => {
  vi.clearAllMocks();

  mockList.mockResolvedValue(auditRows);
});

describe("AuditoriaPage", () => {
  it("carga y muestra los registros de auditoría", async () => {
    renderPage();

    expect(await screen.findByText("Vehículo creado")).toBeInTheDocument();
    expect(screen.getByText("Venta actualizada")).toBeInTheDocument();

    expect(mockList).toHaveBeenCalledWith(undefined);
  });

  it("envía los filtros seleccionados al servicio", async () => {
    const user = userEvent.setup();

    renderPage();

    await screen.findByText("Vehículo creado");

    await user.type(screen.getByLabelText("Usuario"), "admin");
    await user.type(screen.getByLabelText("Acción"), "CREAR");
    await user.type(screen.getByLabelText("Entidad"), "VEHICULO");
    await user.type(screen.getByLabelText("Fecha"), "2026-09-18");

    await user.click(screen.getByRole("button", { name: "Buscar" }));

    await waitFor(() => {
      expect(mockList).toHaveBeenLastCalledWith({
        usuario: "admin",
        accion: "CREAR",
        entidad: "VEHICULO",
        desde: "2026-09-18",
        hasta: "2026-09-18",
      });
    });
  });

  it("limpia los filtros y vuelve a cargar la auditoría", async () => {
    const user = userEvent.setup();

    renderPage();

    await screen.findByText("Vehículo creado");

    const userInput = screen.getByLabelText("Usuario");
    const actionInput = screen.getByLabelText("Acción");
    const entityInput = screen.getByLabelText("Entidad");
    const dateInput = screen.getByLabelText("Fecha");

    await user.type(userInput, "admin");
    await user.type(actionInput, "CREAR");
    await user.type(entityInput, "VEHICULO");
    await user.type(dateInput, "2026-09-18");

    await user.click(screen.getByRole("button", { name: "Limpiar" }));

    await waitFor(() => {
      expect(mockList).toHaveBeenLastCalledWith(undefined);
    });

    expect(userInput).toHaveValue("");
    expect(actionInput).toHaveValue("");
    expect(entityInput).toHaveValue("");
    expect(dateInput).toHaveValue("");
  });

  it("muestra un error cuando falla la consulta de auditoría", async () => {
    mockList.mockRejectedValue(new Error("No se pudo cargar la auditoría."));

    renderPage();

    await waitFor(() => {
      expect(mockShow).toHaveBeenCalledWith(
        "No se pudo cargar la auditoría.",
        "error",
      );
    });
  });
});