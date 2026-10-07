import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BackgroundSession, PendingRepair } from "./indexedDb";
import { syncRepairs } from "./syncEngine";

const state = vi.hoisted(() => ({
  session: undefined as BackgroundSession | undefined,
  rows: [] as PendingRepair[],
  request: vi.fn<typeof fetch>(),
}));
vi.mock("../config/apiConfig", () => ({ API_URL: "https://api.example/api" }));
vi.mock("./backgroundSession", () => ({
  backgroundSession: {
    get: async () => state.session,
    clear: async () => {
      state.session = undefined;
    },
  },
}));
vi.mock("./syncQueue", () => ({
  syncQueue: {
    prune: async () => undefined,
    list: async (owner: string, apiUrl: string) =>
      state.rows.filter((row) => row.owner === owner && row.apiUrl === apiUrl),
    claim: async (
      id: string,
      owner: string,
      apiUrl: string,
      manual: boolean,
    ) => {
      const row = state.rows.find(
        (item) =>
          item.id === id && item.owner === owner && item.apiUrl === apiUrl,
      );
      if (
        !row ||
        row.status === "synced" ||
        (row.leaseUntil ?? 0) > Date.now() ||
        (!manual && ["conflict", "failed"].includes(row.status ?? "pending"))
      )
        return null;
      row.status = "syncing";
      row.attempts += 1;
      row.leaseUntil = Date.now() + 60000;
      return { ...row };
    },
    finish: async (item: PendingRepair, result: Partial<PendingRepair>) => {
      const row = state.rows.find((value) => value.id === item.id);
      if (row) Object.assign(row, result, { leaseUntil: undefined });
    },
  },
}));

beforeEach(() => {
  state.request.mockReset();
  vi.stubGlobal("fetch", state.request);
  state.session = {
    username: "taller",
    apiUrl: "https://api.example/api",
    token: "test-token",
    expiresAt: Date.now() + 60000,
  };
  state.rows = [
    {
      id: "operacion-1",
      owner: "taller",
      apiUrl: "https://api.example/api",
      status: "pending",
      attempts: 0,
      createdAt: "2026-09-17T12:00:00Z",
      payload: {
        vehiculoId: 1,
        fecha: "2026-09-17",
        tipoTrabajo: "MECANICA",
        descripcion: "Cambio de aceite",
        costoRepuestos: 1,
        costoManoObra: 0,
        costoServiciosExternos: 0,
        estadoTarea: "FINALIZADA",
        idOperacionOffline: "operacion-1",
      },
    },
  ];
});
afterEach(() => vi.unstubAllGlobals());
const success = () =>
  new Response(
    JSON.stringify({
      ok: true,
      data: { id: 20, idOperacionOffline: "operacion-1" },
    }),
    { status: 200 },
  );

describe("sincronización idempotente", () => {
  it("conserva la confirmación y no vuelve a enviar una operación completada", async () => {
    state.request.mockResolvedValue(success());
    expect((await syncRepairs()).synced).toBe(1);
    await syncRepairs();
    expect(state.request).toHaveBeenCalledTimes(1);
    expect(state.rows[0].serverId).toBe(20);
  });
  it("reintenta un envío sin confirmación con el mismo payload y UUID", async () => {
    state.request.mockRejectedValueOnce(new TypeError("network"));
    expect((await syncRepairs()).retryable).toBe(true);
    state.request.mockResolvedValueOnce(success());
    await syncRepairs();
    expect(state.request.mock.calls[0][1]?.body).toBe(
      state.request.mock.calls[1][1]?.body,
    );
    expect(state.rows[0].status).toBe("synced");
  });
  it("un 409 queda en conflicto y no se reintenta automáticamente", async () => {
    state.request.mockResolvedValue(new Response("", { status: 409 }));
    expect((await syncRepairs()).failed).toBe(1);
    await syncRepairs();
    expect(state.rows[0].status).toBe("conflict");
    expect(state.request).toHaveBeenCalledTimes(1);
  });
  it("un 401 retira la credencial y mantiene la operación", async () => {
    state.request.mockResolvedValue(new Response("", { status: 401 }));
    await syncRepairs();
    expect(state.session).toBeUndefined();
    expect(state.rows[0].status).toBe("auth_required");
  });
  it("un 400 conserva los datos para revisión", async () => {
    state.request.mockResolvedValue(new Response("", { status: 400 }));
    await syncRepairs();
    expect(state.rows[0].status).toBe("failed");
  });
  it("un 503 conserva el registro y pide reintento", async () => {
    state.request.mockResolvedValue(new Response("", { status: 503 }));
    expect((await syncRepairs()).retryable).toBe(true);
    expect(state.rows[0].status).toBe("retry");
  });
  it("no toma un HTTP 200 sin identificación de la operación como confirmación", async () => {
    state.request.mockResolvedValue(
      new Response('{"ok":true,"data":{"id":20}}', { status: 200 }),
    );
    await syncRepairs();
    expect(state.rows[0].status).toBe("retry");
  });
  it("no envía registros de otra cuenta", async () => {
    state.rows[0].owner = "otro";
    await syncRepairs();
    expect(state.request).not.toHaveBeenCalled();
  });
  it("sin credencial vigente conserva la cola sin hacer solicitudes", async () => {
    state.session = undefined;
    await syncRepairs();
    expect(state.request).not.toHaveBeenCalled();
    expect(state.rows[0].status).toBe("pending");
  });
  it("mantiene el reintento si otro contexto aún tiene reservado el envío", async () => {
    state.rows[0].status = "syncing";
    state.rows[0].leaseUntil = Date.now() + 60000;
    expect((await syncRepairs()).retryable).toBe(true);
    expect(state.request).not.toHaveBeenCalled();
  });
});
