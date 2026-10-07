// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import type { PendingRepair } from "../../../offline/indexedDb";
import OfflineQueuePage from "./OfflineQueuePage";

const mocks = vi.hoisted(() => ({
  online: true,
  list: vi.fn<() => Promise<PendingRepair[]>>(),
  legacy: vi.fn<() => Promise<PendingRepair[]>>(),
  remove: vi.fn<() => Promise<void>>(),
  adoptLegacy: vi.fn<() => Promise<void>>(),
  sync: vi.fn<() => Promise<{ synced: number; failed: number; retryable: boolean }>>(),
  background: vi.fn<() => Promise<boolean>>(),
  show: vi.fn(),
  confirm: vi.fn<() => Promise<boolean>>(),
}));

vi.mock("../../../hooks/useAuth", () => ({
  useAuth: () => ({ session: { username: "taller" } }),
}));

vi.mock("../../../hooks/useOnlineStatus", () => ({
  useOnlineStatus: () => mocks.online,
}));

vi.mock("../../../offline/syncQueue", () => ({
  syncQueue: {
    list: mocks.list,
    legacy: mocks.legacy,
    remove: mocks.remove,
    adoptLegacy: mocks.adoptLegacy,
  },
}));

vi.mock("../../../offline/tallerOfflineService", () => ({
  tallerOfflineService: { sync: mocks.sync },
}));

vi.mock("../../../offline/backgroundSync", () => ({
  QUEUE_CHANGED_EVENT: "pamahe:offline-queue-changed",
  requestBackgroundSync: mocks.background,
}));

vi.mock("../../../shared/feedback/useToast", () => ({
  useToast: () => ({ show: mocks.show }),
}));

vi.mock("../../../shared/feedback/useConfirmDialog", () => ({
  useConfirmDialog: () => ({ confirm: mocks.confirm }),
}));

const pending: PendingRepair = {
  id: "operation-1",
  owner: "taller",
  apiUrl: "http://localhost:8080/api",
  createdAt: "2026-09-27T10:00:00-03:00",
  attempts: 1,
  status: "pending",
  payload: {
    vehiculoId: 12,
    fecha: "2026-09-27",
    tipoTrabajo: "MECANICA",
    descripcion: "Cambio de aceite",
    costoRepuestos: 2000,
    costoManoObra: 1000,
    costoServiciosExternos: 0,
    estadoTarea: "PENDIENTE",
    idOperacionOffline: "operation-1",
  },
};

function renderPage() {
  return render(
    <MemoryRouter>
      <OfflineQueuePage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.online = true;
  mocks.list.mockResolvedValue([pending]);
  mocks.legacy.mockResolvedValue([]);
  mocks.remove.mockResolvedValue();
  mocks.adoptLegacy.mockResolvedValue();
  mocks.sync.mockResolvedValue({ synced: 1, failed: 0, retryable: false });
  mocks.background.mockResolvedValue(true);
  mocks.confirm.mockResolvedValue(true);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("OfflineQueuePage", () => {
  it("presenta las operaciones pendientes y su estado de sincronización", async () => {
    renderPage();

    expect(await screen.findByText("Cambio de aceite")).toBeInTheDocument();
    expect(screen.getByText("Pendiente de envío")).toBeInTheDocument();
    expect(
      await screen.findByText(/La sincronización automática está activa/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sincronizar ahora" })).toBeEnabled();
  });

  it("permite forzar la sincronización de los registros pendientes", async () => {
    renderPage();
    await screen.findByText("Cambio de aceite");

    fireEvent.click(screen.getByRole("button", { name: "Sincronizar ahora" }));

    await waitFor(() => expect(mocks.sync).toHaveBeenCalledWith(true));
    expect(mocks.show).toHaveBeenCalledWith(
      "1 registro(s) confirmado(s).",
      "success",
    );
  });

  it("descarta una operación local únicamente después de confirmación", async () => {
    renderPage();
    await screen.findByText("Cambio de aceite");

    fireEvent.click(screen.getByRole("button", { name: "Descartar" }));

    await waitFor(() => expect(mocks.remove).toHaveBeenCalled());
  });

  it("deshabilita el envío manual mientras el dispositivo está sin conexión", async () => {
    mocks.online = false;
    renderPage();

    expect(await screen.findByText("Cambio de aceite")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sincronizar ahora" })).toBeDisabled();
  });
});
