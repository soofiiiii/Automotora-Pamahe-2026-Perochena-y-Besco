/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PAGE_SIZE } from "../../../config/appConfig";
import { auditoriaService } from "../../../services/api";
import type { PageResult } from "../../../types/api.types";
import type { Auditoria } from "../../../types/domain.types";
import AuditoriaPage from "./AuditoriaPage";

vi.mock("../../../services/api", () => ({
  auditoriaService: {
    page: vi.fn(),
  },
}));

const pageMock = vi.mocked(auditoriaService.page);

function page(number = 0): PageResult<Auditoria> {
  return {
    content: [
      {
        id: number + 1,
        usuario: "admin",
        accion: "CAMBIO_ESTADO",
        entidad: "Vehiculo",
        entidadId: 7,
        detalle: `Página ${number + 1}`,
        creadoEn: "2026-09-20T10:30:00",
      },
    ],
    number,
    size: PAGE_SIZE,
    totalElements: PAGE_SIZE + 1,
    totalPages: 2,
    serverPaged: true,
  };
}

afterEach(() => {
  pageMock.mockReset();
});

describe("AuditoriaPage", () => {
  it("envía filtros combinados y fechas desde/hasta de forma independiente", async () => {
    pageMock.mockResolvedValue(page(0));
    render(<AuditoriaPage />);

    await screen.findByText("Página 1");

    fireEvent.change(screen.getByLabelText("Usuario"), {
      target: { value: "admin" },
    });
    fireEvent.change(screen.getByLabelText("Acción"), {
      target: { value: "CAMBIO_ESTADO" },
    });
    fireEvent.change(screen.getByLabelText("Entidad"), {
      target: { value: "Vehiculo" },
    });
    fireEvent.change(screen.getByLabelText("ID de entidad"), {
      target: { value: "7" },
    });
    fireEvent.change(screen.getByLabelText("Desde"), {
      target: { value: "2026-09-01" },
    });
    fireEvent.change(screen.getByLabelText("Hasta"), {
      target: { value: "2026-09-20" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

    await waitFor(() => {
      expect(pageMock).toHaveBeenLastCalledWith(
        {
          usuario: "admin",
          accion: "CAMBIO_ESTADO",
          entidad: "Vehiculo",
          entidadId: 7,
          desde: "2026-09-01",
          hasta: "2026-09-20",
          page: 0,
          size: PAGE_SIZE,
        },
        expect.any(AbortSignal),
      );
    });
  });

  it("permite enviar solo uno de los extremos del rango sin duplicarlo", async () => {
    pageMock.mockResolvedValue(page(0));
    render(<AuditoriaPage />);

    await screen.findByText("Página 1");

    fireEvent.change(screen.getByLabelText("Desde"), {
      target: { value: "2026-09-10" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

    await waitFor(() => {
      expect(pageMock).toHaveBeenLastCalledWith(
        {
          desde: "2026-09-10",
          page: 0,
          size: PAGE_SIZE,
        },
        expect.any(AbortSignal),
      );
    });
  });

  it("impide consultar cuando desde es posterior a hasta", async () => {
    pageMock.mockResolvedValue(page(0));
    render(<AuditoriaPage />);

    await screen.findByText("Página 1");
    const callsBeforeInvalidSearch = pageMock.mock.calls.length;

    fireEvent.change(screen.getByLabelText("Desde"), {
      target: { value: "2026-09-21" },
    });
    fireEvent.change(screen.getByLabelText("Hasta"), {
      target: { value: "2026-09-20" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

    expect(
      screen.getByText(
        'La fecha "Desde" no puede ser posterior a la fecha "Hasta".',
      ),
    ).toBeInTheDocument();
    expect(pageMock).toHaveBeenCalledTimes(callsBeforeInvalidSearch);
  });

  it("solicita page=1 al navegar a la segunda página", async () => {
    pageMock.mockImplementation(async (params) => page(params.page ?? 0));
    render(<AuditoriaPage />);

    await screen.findByText("Página 1");
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    await waitFor(() => {
      expect(pageMock).toHaveBeenLastCalledWith(
        {
          page: 1,
          size: PAGE_SIZE,
        },
        expect.any(AbortSignal),
      );
    });
    expect(await screen.findByText("Página 2")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Usuario"), {
      target: { value: "admin" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

    await waitFor(() => {
      expect(pageMock).toHaveBeenLastCalledWith(
        {
          usuario: "admin",
          page: 0,
          size: PAGE_SIZE,
        },
        expect.any(AbortSignal),
      );
    });
  });
});
