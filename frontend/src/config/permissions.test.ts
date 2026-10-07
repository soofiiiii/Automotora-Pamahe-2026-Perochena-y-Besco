import { describe, expect, it } from "vitest";
import {
  COMMERCIAL_ROLES,
  IMAGE_DELETE_ROLES,
  INTERNAL_OBSERVATIONS_ROLES,
  MANAGEMENT_ROLES,
  PURCHASE_RECEIPT_ROLES,
  hasAnyRole,
} from "./permissions";

describe("permisos visibles por rol", () => {
  it("reserva el comprobante de compra a ADMINISTRADOR y DUENO", () => {
    expect(hasAnyRole(["ADMINISTRADOR"], PURCHASE_RECEIPT_ROLES)).toBe(true);
    expect(hasAnyRole(["DUENO"], PURCHASE_RECEIPT_ROLES)).toBe(true);
    expect(hasAnyRole(["VENDEDOR"], PURCHASE_RECEIPT_ROLES)).toBe(false);
    expect(hasAnyRole(["TALLER"], PURCHASE_RECEIPT_ROLES)).toBe(false);
  });

  it("mantiene las acciones gerenciales sensibles fuera de VENDEDOR y TALLER", () => {
    expect(hasAnyRole(["VENDEDOR"], MANAGEMENT_ROLES)).toBe(false);
    expect(hasAnyRole(["TALLER"], MANAGEMENT_ROLES)).toBe(false);
    expect(hasAnyRole(["VENDEDOR"], INTERNAL_OBSERVATIONS_ROLES)).toBe(false);
    expect(hasAnyRole(["TALLER"], IMAGE_DELETE_ROLES)).toBe(false);
  });

  it("mantiene las capacidades comerciales para VENDEDOR", () => {
    expect(hasAnyRole(["VENDEDOR"], COMMERCIAL_ROLES)).toBe(true);
  });
});
