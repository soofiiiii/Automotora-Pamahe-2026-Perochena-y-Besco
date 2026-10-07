import { describe, expect, it } from "vitest";
import {
  hasCommercialData,
  hasManagementData,
  type VehiculoTaller,
} from "./vehiculo.types";

const workshop: VehiculoTaller = {
  id: 1,
  marca: "Ford",
  modelo: "Fiesta",
  tipoVehiculo: "AUTO",
  tipoVehiculoLabel: "Automóvil",
  anio: 2014,
  matricula: null,
  estado: "EN_TALLER",
  ubicacionActual: "LOCAL",
  activo: true,
};
describe("proyecciones de vehículos", () => {
  it("taller no implica un vehículo no publicado ni un precio cero", () => {
    expect(hasCommercialData(workshop)).toBe(false);
    expect(hasManagementData(workshop)).toBe(false);
  });
  it("la proyección comercial se reconoce incluso sin precio", () => {
    expect(
      hasCommercialData({
        ...workshop,
        publicado: false,
        precioVentaEstimado: null,
      }),
    ).toBe(true);
  });
  it("los datos gerenciales no se deducen del rol declarado por el cliente", () => {
    expect(
      hasManagementData({
        ...workshop,
        publicado: false,
        precioVentaEstimado: null,
      }),
    ).toBe(false);
    expect(
      hasManagementData({
        ...workshop,
        publicado: false,
        precioVentaEstimado: null,
        costoInicial: 0,
        observacionesInternas: null,
      }),
    ).toBe(true);
  });
});
