import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AxiosAdapter, AxiosResponse } from "axios";

import { apiClient } from "./apiClient";
import { authStorage } from "./authStorage";

const adapterResponse = (
  response: Partial<AxiosResponse>,
): AxiosResponse => ({
  data: undefined,
  status: 200,
  statusText: "OK",
  headers: {},
  config: {} as AxiosResponse["config"],
  ...response,
});

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("apiClient", () => {
  it("desenvuelve correctamente una respuesta exitosa de la API", async () => {
    const adapter: AxiosAdapter = async (config) =>
      adapterResponse({
        data: {
          ok: true,
          data: [{ id: 1, nombre: "Prueba" }],
        },
        status: 200,
        statusText: "OK",
        config,
      });

    const response = await apiClient.get("/test", {
      adapter,
    });

    expect(response.data).toEqual([{ id: 1, nombre: "Prueba" }]);
  });

    it("limpia la sesión y notifica cuando la API responde 401", async () => {
        const clearSpy = vi.spyOn(authStorage, "clear");
        const dispatchSpy = vi.spyOn(window, "dispatchEvent");

        const adapter: AxiosAdapter = async (config) => {
            const error = new Error("Unauthorized") as Error & {
            response?: {
                status: number;
                data: unknown;
                headers: Record<string, string>;
                config: typeof config;
                statusText: string;
            };
            };

            error.response = {
            status: 401,
            data: {
                ok: false,
                error: "AUTH_TOKEN_INVALID",
            },
            headers: {},
            config,
            statusText: "Unauthorized",
            };

            throw error;
        };

        await expect(
            apiClient.get("/test", {
            adapter,
            }),
        ).rejects.toMatchObject({
            response: {
            status: 401,
            },
        });

        expect(clearSpy).toHaveBeenCalledTimes(1);

        expect(dispatchSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "pamahe:unauthorized",
                }),
            );
    });
});