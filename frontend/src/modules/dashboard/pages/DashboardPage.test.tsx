import { describe, expect, it } from "vitest";
import { formatCurrency } from "../../../utils/formatCurrency";

describe("formatCurrency", () => {
  it("formatea un monto en UYU", () => {
    expect(formatCurrency(1000)).toContain("1.000");
  });
});
