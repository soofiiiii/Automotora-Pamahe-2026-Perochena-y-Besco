import { describe, expect, it } from "vitest";
import { calculateDaysInStock, formatDaysInStock } from "./daysInStock";

describe("daysInStock", () => {
  it("calcula hasta hoy para un vehículo todavía en stock", () => {
    expect(calculateDaysInStock("2026-09-01", null, new Date(2026, 9, 4))).toBe(33);
  });

  it("cierra el cálculo en la fecha de venta", () => {
    expect(calculateDaysInStock("2026-09-01", "2026-09-21")).toBe(20);
  });

  it("no informa un valor si falta la fecha de compra", () => {
    expect(calculateDaysInStock(null, null)).toBeNull();
  });

  it("formatea singular y plural", () => {
    expect(formatDaysInStock(1)).toBe("1 día en stock");
    expect(formatDaysInStock(42)).toBe("42 días en stock");
  });
});
