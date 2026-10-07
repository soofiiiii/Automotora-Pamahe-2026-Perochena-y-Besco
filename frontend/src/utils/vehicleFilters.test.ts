import { describe, expect, it } from "vitest";
import { parseVehicleFilters } from "./vehicleFilters";

describe("filtros de vehículos", () => {
  it("conserva cero y false al combinar rangos, tipo y disponibilidad", () => {
    expect(
      parseVehicleFilters(
        new URLSearchParams(
          "marca=Toyota&tipoVehiculo=AUTO&anioDesde=2010&anioHasta=2020&precioMin=0&precioMax=20000&disponibleComercial=false&publicado=false",
        ),
        true,
      ),
    ).toEqual({
      marca: "Toyota",
      tipoVehiculo: "AUTO",
      anioDesde: 2010,
      anioHasta: 2020,
      precioMin: 0,
      precioMax: 20000,
      disponibleComercial: false,
      publicado: false,
    });
  });
  it.each([
    "precioMin=200&precioMax=100",
    "anioDesde=2020&anioHasta=2010",
    "precioMin=NaN",
    "anioDesde=2010.5",
    "disponibleComercial=yes",
    "estado=RESERVADO&disponibleComercial=true",
  ])("rechaza filtros inconsistentes: %s", (query) => {
    expect(() =>
      parseVehicleFilters(new URLSearchParams(query), true),
    ).toThrow();
  });
  it("no envía precio o publicación para taller aunque estén en la URL", () => {
    expect(
      parseVehicleFilters(
        new URLSearchParams("marca=Ford&precioMin=2&publicado=true"),
        true,
        false,
      ),
    ).toEqual({ marca: "Ford" });
  });
});
