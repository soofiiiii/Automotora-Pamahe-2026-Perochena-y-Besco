import { describe, expect, it } from "vitest";
import {
  hasCompraFinancialData,
  type Compra,
  type CompraCreateResponse,
  type CompraRegistroResponse,
} from "./domain.types";

const managementPurchase: Compra = {
  id: 30,
  vehiculoId: 10,
  vehiculo: "Toyota Corolla",
  clienteVendedorId: 20,
  clienteVendedor: "Ana Pérez",
  usuarioResponsableId: 3,
  usuarioResponsable: "Administrador",
  fechaCompra: "2026-09-27",
  costoAdquisicion: 15000,
  comprobanteUrl: "/compras/30/comprobante",
  observaciones: "Operación gerencial",
};

const sellerPurchase: CompraRegistroResponse = {
  id: 31,
  vehiculoId: 11,
  vehiculo: "Ford Fiesta",
  clienteVendedorId: 21,
  clienteVendedor: "Luis Gómez",
  usuarioResponsableId: 4,
  usuarioResponsable: "Vendedor",
  fechaCompra: "2026-09-27",
};

describe("contrato de creación de compras por rol", () => {
  it("identifica la respuesta gerencial por la presencia de datos financieros", () => {
    const response: CompraCreateResponse = managementPurchase;

    expect(hasCompraFinancialData(response)).toBe(true);
    if (hasCompraFinancialData(response)) {
      expect(response.costoAdquisicion).toBe(15000);
      expect(response.comprobanteUrl).toBe("/compras/30/comprobante");
    }
  });

  it("mantiene la respuesta del vendedor sin datos financieros", () => {
    const response: CompraCreateResponse = sellerPurchase;

    // @ts-expect-error La unión obliga a estrechar el tipo antes de acceder a datos financieros.
    void response.costoAdquisicion;

    expect(hasCompraFinancialData(response)).toBe(false);
    expect("costoAdquisicion" in response).toBe(false);
    expect("comprobanteUrl" in response).toBe(false);
    expect("observaciones" in response).toBe(false);
  });
});
