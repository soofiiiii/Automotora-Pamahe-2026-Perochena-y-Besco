import type { AxiosResponse } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PageResult } from "../types/api.types";
import type { Auditoria } from "../types/domain.types";
import { auditoriaService } from "./api";
import { apiClient } from "./apiClient";

const backendPage = {
  content: [
    {
      id: 25,
      usuario: "admin",
      accion: "CAMBIO_ESTADO",
      entidad: "Vehiculo",
      entidadId: 7,
      detalle: "Estado actualizado",
      creadoEn: "2026-09-20T10:30:00",
    },
  ],
  number: 1,
  size: 12,
  totalElements: 18,
  totalPages: 2,
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("auditoriaService.page", () => {
  it("consulta el endpoint paginado con filtros combinados, rango y página reales", async () => {
    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue({
      data: backendPage,
    } as AxiosResponse<typeof backendPage>);

    const result: PageResult<Auditoria> = await auditoriaService.page({
      usuario: "admin",
      accion: "CAMBIO_ESTADO",
      entidad: "Vehiculo",
      entidadId: 7,
      desde: "2026-09-01",
      hasta: "2026-09-20",
      page: 1,
      size: 12,
    });

    expect(getSpy).toHaveBeenCalledWith("/auditoria/paginado", {
      params: {
        usuario: "admin",
        accion: "CAMBIO_ESTADO",
        entidad: "Vehiculo",
        entidadId: 7,
        desde: "2026-09-01",
        hasta: "2026-09-20",
        page: 1,
        size: 12,
      },
      signal: undefined,
    });
    expect(result).toMatchObject({
      number: 1,
      size: 12,
      totalElements: 18,
      totalPages: 2,
      serverPaged: true,
    });
    expect(result.content).toHaveLength(1);
  });
});
