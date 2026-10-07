import type { AxiosResponse } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  Compra,
  CompraCreateResponse,
  CompraRegistroResponse,
} from "../types/domain.types";
import { compraService } from "./api";
import { apiClient } from "./apiClient";

const request = {
  vehiculoId: 10,
  clienteVendedorId: 20,
  fechaCompra: "2026-09-27",
  costoAdquisicion: 15000,
  observaciones: "Ingreso de unidad",
};

const sellerResponse: CompraRegistroResponse = {
  id: 30,
  vehiculoId: 10,
  vehiculo: "Toyota Corolla",
  clienteVendedorId: 20,
  clienteVendedor: "Ana Pérez",
  usuarioResponsableId: 4,
  usuarioResponsable: "Vendedor Test",
  fechaCompra: "2026-09-27",
};

const managementResponse: Compra = {
  ...sellerResponse,
  costoAdquisicion: 15000,
  comprobanteUrl: "/compras/30/comprobante",
  observaciones: "Ingreso de unidad",
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("compraService.create según permisos financieros", () => {
  it("acepta la proyección reducida devuelta para VENDEDOR", async () => {
    const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue({
      data: sellerResponse,
    } as AxiosResponse<CompraRegistroResponse>);

    const result: CompraCreateResponse = await compraService.create(request);

    expect(postSpy).toHaveBeenCalledWith("/compras", request);
    expect(result).toEqual(sellerResponse);
    expect("costoAdquisicion" in result).toBe(false);
  });

  it("acepta la proyección completa devuelta para ADMINISTRADOR o DUENO", async () => {
    vi.spyOn(apiClient, "post").mockResolvedValue({
      data: managementResponse,
    } as AxiosResponse<Compra>);

    const result: CompraCreateResponse = await compraService.create(request);

    expect(result).toEqual(managementResponse);
    expect("costoAdquisicion" in result).toBe(true);
  });
});
