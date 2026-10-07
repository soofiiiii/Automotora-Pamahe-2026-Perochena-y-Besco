import type { AxiosResponse } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { reporteService } from "./api";
import { apiClient } from "./apiClient";

afterEach(() => vi.restoreAllMocks());

describe("reporteService CF-02", () => {
  it("envía desde/hasta a los seis reportes definidos por backend", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue({ data: {} } as AxiosResponse);
    const signal = new AbortController().signal;

    await reporteService.ventas("2026-09-01", "2026-09-30", signal);
    await reporteService.compras("2026-09-01", "2026-09-30", signal);
    await reporteService.stock("2026-09-01", "2026-09-30", signal);
    await reporteService.vendidos("2026-09-01", "2026-09-30", signal);
    await reporteService.refacciones("2026-09-01", "2026-09-30", signal);
    await reporteService.rentabilidad("2026-09-01", "2026-09-30", signal);

    for (const path of ["ventas", "compras", "stock", "vendidos", "refacciones", "rentabilidad"]) {
      expect(get).toHaveBeenCalledWith(`/reportes/${path}`, {
        params: { desde: "2026-09-01", hasta: "2026-09-30" },
        signal,
      });
    }
  });
  it("descarga el PDF del reporte respetando el período", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue({ data: new Blob(["pdf"]) } as AxiosResponse);

    await reporteService.pdf("rentabilidad", "2026-09-01", "2026-09-30");

    expect(get).toHaveBeenCalledWith("/reportes/rentabilidad.pdf", {
      params: { desde: "2026-09-01", hasta: "2026-09-30" },
      responseType: "blob",
    });
  });

});
