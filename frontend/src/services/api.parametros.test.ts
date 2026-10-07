import type { AxiosResponse } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parametroService } from "./api";
import { apiClient } from "./apiClient";

afterEach(() => vi.restoreAllMocks());

describe("parametroService.listByCategory CF-03", () => {
  it("consulta el endpoint de opciones activas por categoría", async () => {
    const data = [{ id: 1, categoria: "TIPO_VEHICULO", clave: "SUV", valor: "SUV", descripcion: null, activo: true }];
    const signal = new AbortController().signal;
    const get = vi.spyOn(apiClient, "get").mockResolvedValue({ data } as AxiosResponse);

    const result = await parametroService.listByCategory("TIPO_VEHICULO", signal);

    expect(get).toHaveBeenCalledWith("/parametros/opciones", { params: { categoria: "TIPO_VEHICULO" }, signal });
    expect(result).toEqual(data);
  });
});
