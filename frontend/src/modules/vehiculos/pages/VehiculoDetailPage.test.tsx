// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { AppRole } from "../../../config/permissions";
import type {
  VehiculoHistorial,
  VehiculoHistorialComercial,
  VehiculoHistorialGerencial,
  VehiculoHistorialTaller,
} from "../../../types/vehiculo.types";
import VehiculoDetailPage from "./VehiculoDetailPage";

const mocks = vi.hoisted(() => ({
  roles: ["ADMINISTRADOR"] as AppRole[],
  historial:
    vi.fn<(id: number, signal?: AbortSignal) => Promise<VehiculoHistorial>>(),
  state: vi.fn<() => Promise<void>>(),
  publication: vi.fn<() => Promise<void>>(),
  deactivate: vi.fn<() => Promise<void>>(),
  show: vi.fn(),
  confirm: vi.fn<() => Promise<boolean>>(),
}));
vi.mock("../../../hooks/useAuth", () => ({
  useAuth: () => ({ session: { roles: mocks.roles } }),
}));
vi.mock("../../../hooks/useUsdUyuRate", () => ({
  useUsdUyuRate: () => null,
}));
vi.mock("../../../services/api", () => ({ vehiculoService: mocks }));
vi.mock("../../../shared/feedback/useToast", () => ({
  useToast: () => ({ show: mocks.show }),
}));
vi.mock("../../../shared/feedback/useConfirmDialog", () => ({
  useConfirmDialog: () => ({ confirm: mocks.confirm }),
}));
vi.mock("../components/VehicleImages", () => ({ default: () => null }));

const management: VehiculoHistorialGerencial = {
  vehiculo: {
    id: 7,
    marca: "Ford",
    modelo: "Fiesta",
    tipoVehiculo: "UTE_DOBLE",
    tipoVehiculoLabel: "Utilitario doble cabina",
    anio: 2020,
    matricula: "SAB1234",
    estado: "DISPONIBLE",
    ubicacionActual: "LOCAL",
    activo: true,
    publicado: false,
    precioVentaEstimado: 500000,
    costoInicial: 310000,
    observacionesInternas: "Nota gerencial reservada",
  },
  compra: {
    id: 3,
    vehiculoId: 7,
    vehiculo: "Ford Fiesta",
    clienteVendedorId: 1,
    clienteVendedor: "Proveedor de prueba",
    fechaCompra: "2026-09-19",
    costoAdquisicion: 310000,
  },
  refacciones: [
    {
      id: 8,
      vehiculoId: 7,
      vehiculo: "Ford Fiesta",
      fecha: "2026-09-20",
      tipoTrabajo: "MECANICA",
      descripcion: "Revisión de frenos",
      estadoTarea: "FINALIZADA",
      costoRepuestos: 2000,
      costoManoObra: 1000,
      costoServiciosExternos: 0,
      costoTotal: 3000,
    },
  ],
  venta: {
    id: 4,
    vehiculoId: 7,
    vehiculo: "Ford Fiesta",
    clienteCompradorId: 2,
    clienteComprador: "Comprador de prueba",
    fechaVenta: "2026-09-24",
    precioFinal: 500000,
    costoCompraAlVender: 310000,
    costoRefaccionesAlVender: 3000,
    costoTotalAlVender: 313000,
    rentabilidadCalculada: 187000,
    estadoComprobante: "GENERADO",
    intentosComprobante: 1,
    ultimoIntentoComprobante: "2026-09-24T12:00:00",
    proximoIntentoComprobante: null,
    errorComprobante: null,
  },
  imagenes: [],
  eventos: [
    {
      creadoEn: "2026-09-20T10:00:00-03:00",
      usuario: "Sophie",
      accion: "CAMBIO_ESTADO",
      detalle: "Estado actualizado a DISPONIBLE.",
      valoresAnteriores: '{"costoInicial":310000}',
      valoresNuevos: '{"observacionesInternas":"Snapshot reservado"}',
    },
  ],
};
const commercial: VehiculoHistorialComercial = {
  vehiculo: {
    id: 7,
    marca: "Ford",
    modelo: "Fiesta",
    tipoVehiculo: "UTE_DOBLE",
    tipoVehiculoLabel: "Utilitario doble cabina",
    anio: 2020,
    matricula: "SAB1234",
    estado: "DISPONIBLE",
    ubicacionActual: "LOCAL",
    activo: true,
    publicado: false,
    precioVentaEstimado: 500000,
  },
  compra: {
    id: 3,
    clienteVendedorId: 1,
    clienteVendedor: "Proveedor de prueba",
    fechaCompra: "2026-09-19",
  },
  refacciones: [
    {
      id: 8,
      fecha: "2026-09-20",
      tipoTrabajo: "MECANICA",
      descripcion: "Revisión de frenos",
      estadoTarea: "FINALIZADA",
    },
  ],
  venta: {
    id: 4,
    vehiculoId: 7,
    vehiculo: "Ford Fiesta",
    clienteCompradorId: 2,
    clienteComprador: "Comprador de prueba",
    fechaVenta: "2026-09-24",
    precioFinal: 500000,
    medioPago: "TRANSFERENCIA",
    entidadFinanciera: null,
    montoFinanciado: null,
    estadoFinanciacion: null,
    canalOrigen: "PRESENCIAL",
    seguimientoPostventaRealizado: true,
    datosCompradorVerificados: true,
    documentacionRevisada: true,
    cobroConfirmado: true,
    proximoMantenimiento: null,
    estadoComprobante: "GENERADO",
    intentosComprobante: 1,
    ultimoIntentoComprobante: "2026-09-24T12:00:00",
    proximoIntentoComprobante: null,
  },
  imagenes: [],
  eventos: management.eventos,
};
const workshop: VehiculoHistorialTaller = {
  vehiculo: {
    id: 7,
    marca: "Ford",
    modelo: "Fiesta",
    tipoVehiculo: "UTE_DOBLE",
    tipoVehiculoLabel: "Utilitario doble cabina",
    anio: 2020,
    matricula: "SAB1234",
    estado: "DISPONIBLE",
    ubicacionActual: "LOCAL",
    activo: true,
  },
  fechaCompra: "2026-09-19",
  fechaVenta: "2026-09-24",
  refacciones: management.refacciones,
  imagenes: [],
  eventos: management.eventos,
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/app/vehiculos/7"]}>
      <Routes>
        <Route path="/app/vehiculos/:id" element={<VehiculoDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.roles = ["ADMINISTRADOR"];
  mocks.historial.mockReset().mockResolvedValue(management);
  mocks.state.mockResolvedValue();
  mocks.publication.mockResolvedValue();
  mocks.deactivate.mockResolvedValue();
  mocks.confirm.mockResolvedValue(true);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("historial integrado en el detalle", () => {
  it("muestra la ubicación física actual separada del estado", async () => {
    renderPage();
    expect(await screen.findByText("Ubicación actual")).toBeTruthy();
    expect(screen.getByText("Local")).toBeTruthy();
  });

  it.each<[AppRole, VehiculoHistorial]>([
    ["ADMINISTRADOR", management],
    ["DUENO", management],
    ["VENDEDOR", commercial],
    ["TALLER", workshop],
  ])(
    "muestra operaciones y eventos con una consulta de historial para %s",
    async (role, history) => {
      mocks.roles = [role];
      mocks.historial.mockResolvedValue(history);
      const { container } = renderPage();
      expect(
        await screen.findByText("Estado actualizado a DISPONIBLE."),
      ).toBeTruthy();
      expect(screen.getByText("Compra")).toBeTruthy();
      expect(screen.getByText("Venta")).toBeTruthy();
      expect(screen.getByText("Revisión de frenos")).toBeTruthy();
      expect(screen.getByText("Utilitario doble cabina")).toBeTruthy();
      expect(screen.getByText("5 días en stock")).toBeTruthy();
      expect(mocks.historial).toHaveBeenCalledTimes(1);
      expect(mocks.historial).toHaveBeenCalledWith(7, expect.any(AbortSignal));
      expect(container.textContent).not.toContain("Snapshot reservado");
      if (role === "VENDEDOR" || role === "TALLER") {
        expect(screen.queryByText("Resumen económico")).toBeNull();
        expect(screen.queryByText("Nota gerencial reservada")).toBeNull();
        expect(screen.queryByText("Costo compra")).toBeNull();
        expect(screen.queryByText("Rentabilidad")).toBeNull();
      } else {
        expect(screen.getByText("Resumen económico")).toBeTruthy();
      }
      if (role === "TALLER") {
        expect(screen.queryByText(/Precio final:/)).toBeNull();
        expect(screen.queryByText(/Comprador:/)).toBeNull();
        expect(screen.queryByText(/Vendedor:/)).toBeNull();
      }
    },
  );

  it("soporta un historial válido sin cambios de estado o publicación", async () => {
    const historyWithoutEvents: VehiculoHistorialGerencial = {
      vehiculo: management.vehiculo,
      compra: management.compra,
      refacciones: management.refacciones,
      venta: management.venta,
      imagenes: management.imagenes,
      eventos: [],
    };
    mocks.historial.mockResolvedValue(historyWithoutEvents);

    renderPage();

    expect(await screen.findByText("Compra")).toBeTruthy();
    expect(screen.getByText("Revisión de frenos")).toBeTruthy();
    expect(screen.getByText("Venta")).toBeTruthy();
    expect(screen.getByText("No hay cambios de estado o publicación registrados.")).toBeTruthy();
  });

  it("no muestra campos gerenciales ni comerciales a taller incluso con un DTO excesivo", async () => {
    mocks.roles = ["TALLER"];
    renderPage();
    await screen.findByText("Estado actualizado a DISPONIBLE.");
    expect(screen.queryByText("Nota gerencial reservada")).toBeNull();
    expect(screen.queryByText(/Precio final:/)).toBeNull();
    expect(screen.queryByText(/Comprador:/)).toBeNull();
    expect(screen.queryByText(/Vendedor:/)).toBeNull();
  });

  it.each([
    ["EN TALLER", "state", "CAMBIO_ESTADO", "Estado actualizado a EN_TALLER."],
    [
      "Publicar en catálogo",
      "publication",
      "CAMBIO_PUBLICACION",
      "Vehículo publicado en catálogo.",
    ],
    [
      "Dar de baja",
      "deactivate",
      "CAMBIO_ESTADO",
      "Estado actualizado a DADO_DE_BAJA.",
    ],
  ] as const)(
    "recarga los eventos después de %s",
    async (button, method, action, detail) => {
      mocks.historial.mockResolvedValueOnce(management).mockResolvedValue({
        ...management,
        eventos: [
          ...(management.eventos ?? []),
          {
            creadoEn: "2026-09-27T11:00:00-03:00",
            usuario: "Sophie",
            accion: action,
            detalle: detail,
            valoresAnteriores: null,
            valoresNuevos: null,
          },
        ],
      });
      renderPage();
      fireEvent.click(await screen.findByRole("button", { name: button }));
      expect(await screen.findByText(detail)).toBeTruthy();
      expect(mocks[method]).toHaveBeenCalledTimes(1);
      expect(mocks.historial).toHaveBeenCalledTimes(2);
    },
  );


  it("solo muestra la acción de venta cuando el vehículo está disponible", async () => {
    mocks.roles = ["VENDEDOR"];
    mocks.historial.mockResolvedValue(commercial);
    renderPage();

    const sellLink = await screen.findByRole("link", { name: "Registrar venta" });
    expect(sellLink.getAttribute("href")).toBe("/app/ventas/nueva?vehiculoId=7");

    mocks.historial.mockReset().mockResolvedValue({
      ...commercial,
      vehiculo: { ...commercial.vehiculo, estado: "RESERVADO" },
    });
    cleanup();
    renderPage();
    await screen.findByText(/reservado/i);
    expect(screen.queryByRole("link", { name: "Registrar venta" })).toBeNull();
  });

  it("cancela la consulta al salir del detalle", async () => {
    mocks.historial.mockImplementation(
      () => new Promise<VehiculoHistorial>(() => {}),
    );
    const { unmount } = renderPage();
    await waitFor(() => expect(mocks.historial).toHaveBeenCalledTimes(1));
    const signal = mocks.historial.mock.calls[0][1];
    unmount();
    expect(signal?.aborted).toBe(true);
  });
});
