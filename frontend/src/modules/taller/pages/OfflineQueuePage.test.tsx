import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import OfflineQueuePage from "./OfflineQueuePage";

const mockList = vi.hoisted(() => vi.fn());
const mockRemove = vi.hoisted(() => vi.fn());
const mockSync = vi.hoisted(() => vi.fn());
const mockShow = vi.hoisted(() => vi.fn());

vi.mock("../../../offline/syncQueue", () => ({
  syncQueue: {
    list: mockList,
    remove: mockRemove,
  },
}));

vi.mock("../../../offline/tallerOfflineService", () => ({
  tallerOfflineService: {
    sync: mockSync,
  },
}));

vi.mock("../../../shared/feedback/useToast", () => ({
  useToast: () => ({
    show: mockShow,
  }),
}));

const pendingRepair = {
  id: "offline-1",
  payload: {
    vehiculoId: 10,
    fecha: "2026-09-18",
    tipoTrabajo: "MECANICA",
    descripcion: "Cambio de aceite",
    costoRepuestos: 500,
    costoManoObra: 1000,
    costoServiciosExternos: 0,
    estadoTarea: "PENDIENTE",
  },
  createdAt: "2026-09-18T20:00:00.000Z",
  attempts: 1,
  lastError: "API no disponible",
};

function renderPage() {
  return render(<OfflineQueuePage />);
}

beforeEach(() => {
  vi.clearAllMocks();

  mockList.mockResolvedValue([]);
  mockRemove.mockResolvedValue(undefined);
  mockSync.mockResolvedValue({
    synced: 0,
    failed: 0,
  });

  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: true,
  });
});

describe("OfflineQueuePage", () => {
  it("muestra el estado vacío cuando no hay registros pendientes", async () => {
    renderPage();

    expect(
      await screen.findByText("No hay registros pendientes"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("La cola local está sincronizada."),
    ).toBeInTheDocument();

    expect(mockList).toHaveBeenCalled();
  });

  it("muestra los registros pendientes y sus datos", async () => {
    mockList.mockResolvedValue([pendingRepair]);

    renderPage();

    expect(await screen.findByText("Cambio de aceite")).toBeInTheDocument();

    expect(screen.getByText("#10")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("API no disponible")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Descartar/i }),
    ).toBeInTheDocument();
  });

  it("sincroniza los registros pendientes y muestra el resultado", async () => {
    const user = userEvent.setup();

    mockList.mockResolvedValue([pendingRepair]);
    mockSync.mockResolvedValue({
      synced: 1,
      failed: 0,
    });

    renderPage();

    await screen.findByText("Cambio de aceite");

    await user.click(
      screen.getByRole("button", { name: "Sincronizar ahora" }),
    );

    await waitFor(() => {
      expect(mockSync).toHaveBeenCalledTimes(1);
    });

    expect(mockShow).toHaveBeenCalledWith(
      "1 registro(s) sincronizado(s).",
      "success",
    );
  });

  it("permite descartar un registro pendiente después de confirmar", async () => {
    const user = userEvent.setup();

    mockList.mockResolvedValue([pendingRepair]);

    vi.stubGlobal("confirm", vi.fn(() => true));

    renderPage();

    await screen.findByText("Cambio de aceite");

    await user.click(
      screen.getByRole("button", { name: /Descartar/i }),
    );

    await waitFor(() => {
      expect(mockRemove).toHaveBeenCalledWith("offline-1");
    });

    expect(mockList).toHaveBeenCalledTimes(2);

    vi.unstubAllGlobals();
  });
});