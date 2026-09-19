import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RefaccionRequest } from "../types/domain.types";

const mockAdd = vi.hoisted(() => vi.fn());
const mockList = vi.hoisted(() => vi.fn());
const mockRemove = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockCreate = vi.hoisted(() => vi.fn());

vi.mock("./syncQueue", () => ({
  syncQueue: {
    add: mockAdd,
    list: mockList,
    remove: mockRemove,
    update: mockUpdate,
  },
}));

vi.mock("../services/api", () => ({
  tallerService: {
    create: mockCreate,
  },
}));

import { tallerOfflineService } from "./tallerOfflineService";

const payload: RefaccionRequest = {
  vehiculoId: 10,
  fecha: "2026-09-18",
  tipoTrabajo: "MECANICA",
  descripcion: "Cambio de aceite",
  costoRepuestos: 500,
  costoManoObra: 1000,
  costoServiciosExternos: 0,
  estadoTarea: "PENDIENTE",
};

beforeEach(() => {
  vi.clearAllMocks();

  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: true,
  });
});

describe("tallerOfflineService", () => {
  it("guarda una reparación en la cola offline", async () => {
    mockAdd.mockResolvedValue(undefined);

    const id = await tallerOfflineService.save(payload);

    expect(id).toEqual(expect.any(String));

    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        id,
        payload: expect.objectContaining({
          ...payload,
          sincronizadoDesdeOffline: true,
          idOperacionOffline: id,
        }),
        attempts: 0,
        createdAt: expect.any(String),
      }),
    );
  });

  it("no sincroniza cuando no hay conexión", async () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });

    const result = await tallerOfflineService.sync();

    expect(result).toEqual({
      synced: 0,
      failed: 0,
    });

    expect(mockList).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("sincroniza y elimina de la cola los registros exitosos", async () => {
    const item = {
      id: "offline-1",
      payload,
      createdAt: new Date().toISOString(),
      attempts: 0,
    };

    mockList.mockResolvedValue([item]);
    mockCreate.mockResolvedValue({});
    mockRemove.mockResolvedValue(undefined);

    const result = await tallerOfflineService.sync();

    expect(mockCreate).toHaveBeenCalledWith(item.payload);
    expect(mockRemove).toHaveBeenCalledWith(item.id);

    expect(result).toEqual({
      synced: 1,
      failed: 0,
    });
  });

  it("mantiene pendiente un registro fallido y aumenta los intentos", async () => {
    const item = {
      id: "offline-2",
      payload,
      createdAt: new Date().toISOString(),
      attempts: 1,
    };

    mockList.mockResolvedValue([item]);
    mockCreate.mockRejectedValue(new Error("API no disponible"));
    mockUpdate.mockResolvedValue(undefined);

    const result = await tallerOfflineService.sync();

    expect(mockRemove).not.toHaveBeenCalled();

    expect(mockUpdate).toHaveBeenCalledWith({
      ...item,
      attempts: 2,
      lastError: "API no disponible",
    });

    expect(result).toEqual({
      synced: 0,
      failed: 1,
    });
  });
});