import { describe, expect, it } from "vitest";
import { passwordValidation } from "./passwordValidation";

describe("contraseñas", () => {
  it("acepta una contraseña dentro de los límites", () =>
    expect(passwordValidation("Una clave diferente 2026")).toBeUndefined());
  it.each(["corta", "        ", "x".repeat(73), "á".repeat(37)])(
    "rechaza longitud inválida o espacios",
    (password) => expect(passwordValidation(password)).toBeDefined(),
  );
});
