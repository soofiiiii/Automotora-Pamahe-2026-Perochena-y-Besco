// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { Refaccion } from "../../../types/domain.types";
import RefaccionDetailPage from "./RefaccionDetailPage";

const mocks = vi.hoisted(() => ({
  get: vi.fn<
    (id: number, vehicleId?: number, signal?: AbortSignal) => Promise<Refaccion>
  >(),
}));

vi.mock("../../../services/api", () => ({
  tallerService: { get: mocks.get },
}));

vi.mock("../../vehiculos/components/VehicleImages", () => ({
  default: ({ vehicleId }: { vehicleId: number }) => (
    <div>Imágenes del vehículo {vehicleId}</div>
  ),
}));

const repair: Refaccion = {
  id: 3,
  vehiculoId: 12,
  vehiculo: "Toyota Corolla",
  responsableOperativo: "Mecánico de turno",
  usuarioQueRegistra: "Taller",
  fecha: "2026-09-27",
  tipoTrabajo: "MECANICA",
  descripcion: "Cambio de aceite y filtros",
  costoRepuestos: 3200,
  costoManoObra: 1800,
  costoServiciosExternos: 0,
  costoTotal: 5000,
  estadoTarea: "FINALIZADA",
  observaciones: "Sin novedades",
  sincronizadoDesdeOffline: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.get.mockResolvedValue(repair);
});

afterEach(() => cleanup());

describe("RefaccionDetailPage", () => {
  it("muestra el detalle operativo, el origen y los accesos relacionados", async () => {
    render(
      <MemoryRouter initialEntries={["/app/taller/3?vehiculoId=12"]}>
        <Routes>
          <Route path="/app/taller/:id" element={<RefaccionDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("Cambio de aceite y filtros"),
    ).toBeInTheDocument();
    expect(screen.getByText("Mecánico de turno")).toBeInTheDocument();
    expect(screen.getByText("Registro sin conexión")).toBeInTheDocument();
    expect(screen.getByText("Imágenes del vehículo 12")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Editar tarea" })).toHaveAttribute(
      "href",
      "/app/taller/3/editar?vehiculoId=12",
    );
    expect(
      screen.getByRole("link", { name: "Abrir vehículo" }),
    ).toHaveAttribute("href", "/app/vehiculos/12");
    expect(mocks.get).toHaveBeenCalledWith(3, 12, expect.any(AbortSignal));
  });

  it("informa un identificador inválido sin llamar al servicio", async () => {
    render(
      <MemoryRouter initialEntries={["/app/taller/abc"]}>
        <Routes>
          <Route path="/app/taller/:id" element={<RefaccionDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("El enlace de la refacción no es válido."),
    ).toBeInTheDocument();
    expect(mocks.get).not.toHaveBeenCalled();
  });
});
