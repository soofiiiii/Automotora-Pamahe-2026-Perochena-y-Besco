import { describe, expect, it } from "vitest";
import { errorMessage } from "./errorMessage";

function apiError(status: number, data: Record<string, unknown>, code?: string) {
  return {
    isAxiosError: true,
    code,
    response: { status, data },
  };
}

describe("errorMessage", () => {
  it("muestra credenciales inválidas sin exponer el identificador de incidente", () => {
    const message = errorMessage(
      apiError(401, {
        codigo: "INVALID_CREDENTIALS",
        mensaje: "Usuario o contraseña incorrectos.",
        incidenteId: "incidente-123",
      }),
    );

    expect(message).toBe("Usuario o contraseña incorrectos.");
    expect(message).not.toContain("incidente");
    expect(message).not.toContain("123");
  });

  it("conserva reglas de negocio redactadas para el usuario", () => {
    expect(
      errorMessage(
        apiError(400, {
          codigo: "BUSINESS_RULE",
          mensaje: "El vehículo debe tener una compra activa antes de registrar la venta.",
        }),
      ),
    ).toBe("El vehículo debe tener una compra activa antes de registrar la venta.");
  });

  it("resume las validaciones del backend con mensajes accionables", () => {
    expect(
      errorMessage(
        apiError(400, {
          codigo: "VALIDATION_ERROR",
          detalles: {
            precioFinal: "El precio final debe ser mayor que cero.",
            fechaVenta: "La fecha de venta es obligatoria.",
          },
        }),
      ),
    ).toBe(
      "Revisá los datos ingresados: El precio final debe ser mayor que cero. La fecha de venta es obligatoria.",
    );
  });

  it("oculta mensajes técnicos y usa el contexto de la operación", () => {
    expect(
      errorMessage(
        new Error("Respuesta sin confirmación idempotente"),
        "No pudimos sincronizar la refacción.",
      ),
    ).toBe("No pudimos sincronizar la refacción.");
  });

  it("explica un timeout sin culpar al usuario", () => {
    expect(errorMessage({ isAxiosError: true, code: "ECONNABORTED" })).toBe(
      "La operación demoró más de lo esperado. Verificá tu conexión e intentá nuevamente.",
    );
  });
});
