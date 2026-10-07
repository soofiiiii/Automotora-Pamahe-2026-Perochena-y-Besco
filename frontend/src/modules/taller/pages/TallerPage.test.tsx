// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import type { Refaccion } from "../../../types/domain.types";
import TallerPage from "./TallerPage";

const mocks = vi.hoisted(() => ({
  list: vi.fn<(estado?: string, signal?: AbortSignal) => Promise<Refaccion[]>>(),
}));

vi.mock("../../../services/api", () => ({
  tallerService: { list: mocks.list },
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
  estadoTarea: "EN_CURSO",
  registroFotograficoUrl: null,
};

function renderPage() {
  return render(
    <MemoryRouter>
      <TallerPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.list.mockResolvedValue([repair]);
});

afterEach(() => cleanup());

describe("TallerPage", () => {
  it("presenta los trabajos con responsable, costos y acceso al detalle", async () => {
    renderPage();

    expect(await screen.findByText("Cambio de aceite y filtros")).toBeInTheDocument();
    expect(screen.getByText("Mecánico de turno")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Abrir tarea" })).toHaveAttribute(
      "href",
      "/app/taller/3?vehiculoId=12",
    );
    expect(mocks.list).toHaveBeenCalledWith(undefined, expect.any(AbortSignal));
  });

  it("vuelve a consultar cuando cambia el estado de tarea", async () => {
    renderPage();
    await screen.findByText("Cambio de aceite y filtros");

    fireEvent.change(screen.getByLabelText("Estado de tarea"), {
      target: { value: "FINALIZADA" },
    });

    await waitFor(() =>
      expect(mocks.list).toHaveBeenLastCalledWith(
        "FINALIZADA",
        expect.any(AbortSignal),
      ),
    );
  });

  it("permite reintentar manualmente la carga", async () => {
    renderPage();
    await screen.findByText("Cambio de aceite y filtros");

    fireEvent.click(screen.getByRole("button", { name: "Actualizar" }));

    await waitFor(() => expect(mocks.list).toHaveBeenCalledTimes(2));
  });
});
