// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { Refaccion } from "../../../types/domain.types";
import type { Vehiculo } from "../../../types/vehiculo.types";
import RefaccionFormPage from "./RefaccionFormPage";

const mocks = vi.hoisted(() => ({
  online: true,
  vehicles: vi.fn<
    (params?: unknown, signal?: AbortSignal) => Promise<Vehiculo[]>
  >(),
  getRepair: vi.fn<
    (id: number, vehicleId?: number, signal?: AbortSignal) => Promise<Refaccion>
  >(),
  updateRepair: vi.fn<(id: number, body: Record<string, unknown>) => Promise<Refaccion>>(),
  offlineSave: vi.fn<(body: Record<string, unknown>) => Promise<void>>(),
  offlineSync: vi.fn<() => Promise<{ synced: number; failed: number }>>(),
  queueList: vi.fn<() => Promise<Array<{ id: string; status: string }>>>(),
  cacheSave: vi.fn<() => Promise<void>>(),
  cacheGet: vi.fn(),
  show: vi.fn(),
}));

vi.mock("../../../hooks/useOnlineStatus", () => ({
  useOnlineStatus: () => mocks.online,
}));

vi.mock("../../../hooks/useAuth", () => ({
  useAuth: () => ({
    session: {
      username: "taller",
      roles: ["TALLER"],
      token: "token-de-prueba-con-longitud-suficiente-123456",
    },
  }),
}));

vi.mock("../../../services/api", () => ({
  vehiculoService: { list: mocks.vehicles },
  tallerService: {
    get: mocks.getRepair,
    update: mocks.updateRepair,
  },
}));

vi.mock("../../../offline/tallerOfflineService", () => ({
  tallerOfflineService: {
    save: mocks.offlineSave,
    sync: mocks.offlineSync,
  },
}));

vi.mock("../../../offline/syncQueue", () => ({
  syncQueue: { list: mocks.queueList },
}));

vi.mock("../../../offline/vehicleCache", () => ({
  vehicleCache: {
    save: mocks.cacheSave,
    get: mocks.cacheGet,
  },
}));

vi.mock("../../../shared/feedback/useToast", () => ({
  useToast: () => ({ show: mocks.show }),
}));

const vehicle: Vehiculo = {
  id: 12,
  marca: "Toyota",
  modelo: "Corolla",
  tipoVehiculoLabel: null,
  anio: 2021,
  matricula: "ABC1234",
  estado: "EN_TALLER",
  ubicacionActual: "LOCAL",
  activo: true,
};

const repair: Refaccion = {
  id: 6,
  vehiculoId: 12,
  vehiculo: "Toyota Corolla",
  responsableOperativo: "Mecánico",
  usuarioQueRegistra: "Taller",
  fecha: "2026-09-27",
  tipoTrabajo: "MECANICA",
  descripcion: "Revisión de frenos",
  costoRepuestos: 2000,
  costoManoObra: 1200,
  costoServiciosExternos: 0,
  costoTotal: 3200,
  estadoTarea: "EN_CURSO",
};

function renderPage(path = "/app/taller/nueva") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/app/taller/nueva" element={<RefaccionFormPage />} />
        <Route path="/app/taller/:id/editar" element={<RefaccionFormPage />} />
        <Route path="/app/taller/:id" element={<div>Detalle de refacción</div>} />
        <Route path="/app/taller/offline" element={<div>Cola offline</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.online = true;
  mocks.vehicles.mockResolvedValue([vehicle]);
  mocks.getRepair.mockResolvedValue(repair);
  mocks.updateRepair.mockResolvedValue(repair);
  mocks.offlineSave.mockResolvedValue();
  mocks.offlineSync.mockResolvedValue({ synced: 1, failed: 0 });
  mocks.queueList.mockResolvedValue([{ id: "operation-1", status: "synced" }]);
  mocks.cacheSave.mockResolvedValue();
  mocks.cacheGet.mockResolvedValue(null);
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    get: () => true,
  });
  vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(
    "operation-1" as `${string}-${string}-${string}-${string}-${string}`,
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("RefaccionFormPage", () => {
  it("permite seleccionar un vehículo reservado para una nueva tarea", async () => {
    mocks.vehicles.mockResolvedValue([{ ...vehicle, id: 13, modelo: "Yaris", estado: "RESERVADO" }]);
    renderPage();
    expect(await screen.findByRole("option", { name: /Toyota Yaris/ })).toBeInTheDocument();
  });

  it("registra un trabajo nuevo, sincroniza y abre la cola de seguimiento", async () => {
    renderPage();

    expect(await screen.findByRole("option", { name: /Toyota Corolla/ })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Vehículo"), { target: { value: "12" } });
    fireEvent.change(screen.getByLabelText("Descripción"), {
      target: { value: "Cambio de aceite" },
    });
    fireEvent.change(screen.getByLabelText("Costo de repuestos"), {
      target: { value: "2500" },
    });
    fireEvent.change(screen.getByLabelText("Costo de mano de obra"), {
      target: { value: "1500" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar refacción" }));

    await waitFor(() =>
      expect(mocks.offlineSave).toHaveBeenCalledWith(
        expect.objectContaining({
          vehiculoId: 12,
          descripcion: "Cambio de aceite",
          costoRepuestos: 2500,
          costoManoObra: 1500,
          idOperacionOffline: "operation-1",
        }),
      ),
    );
    expect(mocks.offlineSync).toHaveBeenCalled();
    expect(await screen.findByText("Cola offline")).toBeInTheDocument();
  });

  it("carga una tarea existente y actualiza solo sus datos editables", async () => {
    renderPage("/app/taller/6/editar?vehiculoId=12");

    expect(await screen.findByDisplayValue("Revisión de frenos")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Descripción"), {
      target: { value: "Revisión completa de frenos" },
    });
    fireEvent.change(screen.getByLabelText("Estado"), {
      target: { value: "FINALIZADA" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar refacción" }));

    await waitFor(() =>
      expect(mocks.updateRepair).toHaveBeenCalledWith(
        6,
        expect.objectContaining({
          descripcion: "Revisión completa de frenos",
          estadoTarea: "FINALIZADA",
        }),
      ),
    );
    expect(await screen.findByText("Detalle de refacción")).toBeInTheDocument();
  });

  it("rechaza identificadores de refacción inválidos", () => {
    renderPage("/app/taller/abc/editar");
    expect(screen.getByText("El enlace de la refacción no es válido.")).toBeInTheDocument();
  });
});
