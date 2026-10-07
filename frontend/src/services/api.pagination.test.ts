import type { AxiosResponse } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PageResult } from "../types/api.types";
import type { Cliente, Compra, Venta } from "../types/domain.types";
import type { CatalogoVehiculo, Vehiculo } from "../types/vehiculo.types";
import {
  catalogoService,
  clienteService,
  compraService,
  vehiculoService,
  ventaService,
} from "./api";
import { apiClient } from "./apiClient";

const backendPage = <T>(content: T[]) => ({
  content,
  number: 1,
  size: 12,
  totalElements: 25,
  totalPages: 3,
});

const axiosResponse = <T>(data: T) => ({ data }) as AxiosResponse<T>;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("servicios paginados", () => {
  it("consulta clientes mediante el endpoint paginado y conserva la búsqueda del servidor", async () => {
    const response = backendPage<Cliente>([]);
    const getSpy = vi
      .spyOn(apiClient, "get")
      .mockResolvedValue(axiosResponse(response));

    const result: PageResult<Cliente> = await clienteService.page({
      q: "María",
      page: 1,
      size: 12,
    });

    expect(getSpy).toHaveBeenCalledWith("/clientes/paginado", {
      params: { q: "María", page: 1, size: 12 },
      signal: undefined,
    });
    expect(result).toMatchObject({
      number: 1,
      size: 12,
      totalElements: 25,
      totalPages: 3,
    });
  });

  it("consulta vehículos mediante el endpoint paginado con filtros de stock", async () => {
    const response = backendPage<Vehiculo>([]);
    const getSpy = vi
      .spyOn(apiClient, "get")
      .mockResolvedValue(axiosResponse(response));

    await vehiculoService.page({
      estado: "DISPONIBLE",
      page: 1,
      size: 12,
      sort: "id,desc",
    });

    expect(getSpy).toHaveBeenCalledWith("/vehiculos/paginado", {
      params: {
        estado: "DISPONIBLE",
        page: 1,
        size: 12,
        sort: "id,desc",
      },
      signal: undefined,
    });
  });

  it("consulta compras mediante el endpoint paginado", async () => {
    const response = backendPage<Compra>([]);
    const getSpy = vi
      .spyOn(apiClient, "get")
      .mockResolvedValue(axiosResponse(response));

    await compraService.page({
      page: 1,
      size: 12,
      sort: "fechaCompra,desc",
    });

    expect(getSpy).toHaveBeenCalledWith("/compras/paginado", {
      params: { page: 1, size: 12, sort: "fechaCompra,desc" },
      signal: undefined,
    });
  });

  it("consulta ventas mediante el endpoint paginado", async () => {
    const response = backendPage<Venta>([]);
    const getSpy = vi
      .spyOn(apiClient, "get")
      .mockResolvedValue(axiosResponse(response));

    await ventaService.page({
      page: 1,
      size: 12,
      sort: "fechaVenta,desc",
    });

    expect(getSpy).toHaveBeenCalledWith("/ventas/paginado", {
      params: { page: 1, size: 12, sort: "fechaVenta,desc" },
      signal: undefined,
    });
  });

  it("consulta el catálogo mediante el endpoint paginado con filtros y orden", async () => {
    const response = backendPage<CatalogoVehiculo>([]);
    const getSpy = vi
      .spyOn(apiClient, "get")
      .mockResolvedValue(axiosResponse(response));

    await catalogoService.page({
      marca: "Toyota",
      tipoVehiculo: "AUTO",
      page: 1,
      size: 12,
      sort: "precioVentaEstimado,asc",
    });

    expect(getSpy).toHaveBeenCalledWith("/catalogo/vehiculos/paginado", {
      params: {
        marca: "Toyota",
        tipoVehiculo: "AUTO",
        page: 1,
        size: 12,
        sort: "precioVentaEstimado,asc",
      },
      signal: undefined,
    });
  });
});
