import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient, asPage } from "./apiClient";
import { authStorage } from "./authStorage";

const response = (
  config: InternalAxiosRequestConfig,
  overrides: Partial<AxiosResponse> = {},
): AxiosResponse => ({
  data: undefined,
  status: 200,
  statusText: "OK",
  headers: {},
  config,
  ...overrides,
});

const failingAdapter = (status: number, data: unknown): AxiosAdapter => async (config) => {
  const error = new Error(`HTTP ${status}`) as Error & {
    response?: AxiosResponse;
  };
  error.response = response(config, {
    status,
    statusText: status === 401 ? "Unauthorized" : "Forbidden",
    data,
  });
  throw error;
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("apiClient", () => {
  it("desenvuelve el envelope exitoso utilizado por la API", async () => {
    const adapter: AxiosAdapter = async (config) =>
      response(config, {
        data: {
          ok: true,
          data: [{ id: 1, nombre: "Prueba" }],
        },
      });

    const result = await apiClient.get("/test", { adapter });

    expect(result.data).toEqual([{ id: 1, nombre: "Prueba" }]);
  });

  it("adjunta el token de la sesión a las solicitudes privadas", async () => {
    vi.spyOn(authStorage, "get").mockReturnValue({
      token: "token-fe06-1234567890",
      username: "admin",
      nombre: "Administrador",
      roles: ["ADMINISTRADOR"],
      debeCambiarPassword: false,
    });

    let authorization: unknown;
    const adapter: AxiosAdapter = async (config) => {
      authorization = config.headers.Authorization;
      return response(config, { data: { ok: true, data: [] } });
    };

    await apiClient.get("/privado", { adapter });

    expect(authorization).toBe("Bearer token-fe06-1234567890");
  });

  it("limpia la sesión y emite la invalidación global ante un 401", async () => {
    const clearSpy = vi.spyOn(authStorage, "clear");
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    await expect(
      apiClient.get("/privado", {
        adapter: failingAdapter(401, {
          ok: false,
          error: "AUTH_TOKEN_INVALID",
        }),
      }),
    ).rejects.toMatchObject({ response: { status: 401 } });

    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "pamahe:unauthorized" }),
    );
  });

  it("emite la obligación de cambio de contraseña ante el 403 específico", async () => {
    const clearSpy = vi.spyOn(authStorage, "clear");
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    await expect(
      apiClient.get("/privado", {
        adapter: failingAdapter(403, {
          codigo: "PASSWORD_CHANGE_REQUIRED",
          mensaje: "Debe cambiar la contraseña.",
        }),
      }),
    ).rejects.toMatchObject({ response: { status: 403 } });

    expect(clearSpy).not.toHaveBeenCalled();
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "pamahe:password-required" }),
    );
  });
});

describe("asPage", () => {
  it("rechaza arreglos para evitar convertir listados completos en páginas simuladas", () => {
    expect(() => asPage([{ id: 1 }])).toThrow(
      "La respuesta paginada del servidor no tiene el formato esperado.",
    );
  });

  it("acepta una respuesta paginada con metadatos completos", () => {
    expect(
      asPage<{ id: number }>({
        content: [{ id: 1 }],
        number: 0,
        size: 12,
        totalElements: 20,
        totalPages: 2,
      }),
    ).toEqual({
      content: [{ id: 1 }],
      number: 0,
      size: 12,
      totalElements: 20,
      totalPages: 2,
      serverPaged: true,
    });
  });
});