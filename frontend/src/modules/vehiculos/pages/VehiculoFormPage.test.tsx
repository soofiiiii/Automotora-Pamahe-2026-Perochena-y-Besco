// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { Vehiculo } from "../../../types/vehiculo.types";
import VehiculoFormPage from "./VehiculoFormPage";

const mocks = vi.hoisted(() => ({
  roles: ["ADMINISTRADOR"] as string[],
  get: vi.fn<(id: number) => Promise<Vehiculo>>(),
  update: vi.fn<
    (id: number, body: Record<string, unknown>) => Promise<Vehiculo>
  >(),
  createWithVehicle: vi.fn(),
  defineDestination: vi.fn(),
  listClients: vi.fn(),
  listByCategory: vi.fn(),
  show: vi.fn(),
}));

vi.mock("../../../hooks/useAuth", () => ({
  useAuth: () => ({ session: { roles: mocks.roles } }),
}));

vi.mock("../../../hooks/useUsdUyuRate", () => ({
  useUsdUyuRate: () => null,
}));

vi.mock("../../../services/api", () => ({
  vehiculoService: {
    get: mocks.get,
    update: mocks.update,
  },
  compraService: {
    createWithVehicle: mocks.createWithVehicle,
    defineDestination: mocks.defineDestination,
    receipt: vi.fn(),
  },
  clienteService: {
    list: mocks.listClients,
  },
  parametroService: {
    listByCategory: mocks.listByCategory,
  },
  ventaService: {
    receipt: vi.fn(),
  },
}));

vi.mock("../../../shared/feedback/useToast", () => ({
  useToast: () => ({ show: mocks.show }),
}));

const vehicle: Vehiculo = {
  id: 4,
  marca: "Toyota",
  modelo: "Corolla",
  tipoVehiculo: "AUTO",
  tipoVehiculoLabel: "Automóvil",
  anio: 2021,
  matricula: "ABC1234",
  numeroChasis: "CHASIS-1",
  color: "Blanco",
  kilometraje: 42000,
  estado: "DISPONIBLE",
  ubicacionActual: "LOCAL",
  descripcionPublica: "Unidad disponible",
  activo: true,
  publicado: true,
  precioVentaEstimado: 890000,
  costoInicial: 700000,
  observacionesInternas: "Control interno",
};

function renderPage(path = "/app/vehiculos/nuevo") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/app/vehiculos/nuevo"
          element={<VehiculoFormPage />}
        />
        <Route
          path="/app/vehiculos/:id/editar"
          element={<VehiculoFormPage />}
        />
        <Route
          path="/app/vehiculos"
          element={<div>Inventario</div>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();

  mocks.roles = ["ADMINISTRADOR"];
  mocks.get.mockResolvedValue(vehicle);

  mocks.listClients.mockResolvedValue([
    {
      id: 20,
      nombre: "Ana",
      apellido: "Pérez",
      documento: "12345678",
      tipoCliente: "VENDEDOR",
      activo: true,
    },
  ]);

  mocks.listByCategory.mockResolvedValue([
    {
      id: 1,
      categoria: "TIPO_VEHICULO",
      clave: "AUTO",
      valor: "Automóvil",
      descripcion: null,
      activo: true,
    },
  ]);

  mocks.createWithVehicle.mockResolvedValue({
    id: 30,
    vehiculoId: 10,
    vehiculo: "Toyota Corolla",
    clienteVendedorId: 20,
    clienteVendedor: "Ana Pérez",
    usuarioResponsableId: 1,
    usuarioResponsable: "Admin",
    fechaCompra: "2026-10-05",
    costoAdquisicion: 700000,
  });

  mocks.update.mockResolvedValue(vehicle);
});

afterEach(() => cleanup());

async function fillRequiredCreationFields() {
  await screen.findByRole("option", { name: /Ana Pérez/i });

  fireEvent.change(screen.getByLabelText("Marca"), {
    target: { value: " Toyota " },
  });

  fireEvent.change(screen.getByLabelText("Modelo"), {
    target: { value: " Corolla " },
  });

  fireEvent.change(screen.getByLabelText("Cliente vendedor"), {
    target: { value: "20" },
  });

  fireEvent.change(screen.getByLabelText("Costo de adquisición"), {
    target: { value: "700000" },
  });
}

describe("VehiculoFormPage", () => {
  it(
    "al crear un vehículo registra también la compra y normaliza los datos",
    async () => {
      renderPage();
      await fillRequiredCreationFields();

      fireEvent.change(screen.getByLabelText(/Matrícula/), {
        target: { value: " abc1234 " },
      });

      fireEvent.change(screen.getByLabelText(/Número de chasis \/ VIN/), {
        target: { value: " chasis-1 " },
      });

      fireEvent.change(
        screen.getByLabelText(/Precio de venta estimado/i),
        {
          target: { value: "890000" },
        },
      );

      fireEvent.click(
        screen.getByRole("button", {
          name: "Registrar vehículo y compra",
        }),
      );

      await waitFor(() =>
        expect(mocks.createWithVehicle).toHaveBeenCalledWith(
          expect.objectContaining({
            vehiculo: expect.objectContaining({
              marca: "Toyota",
              modelo: "Corolla",
              matricula: "ABC1234",
              numeroChasis: "CHASIS-1",
              ubicacionActual: "LOCAL",
              precioVentaUsd: 890000,
            }),
            clienteVendedorId: 20,
            costoAdquisicion: 700000,
          }),
        ),
      );

      expect(
        await screen.findByText(
          "Vehículo y compra registrados correctamente",
        ),
      ).toBeInTheDocument();
    },
  );

  it(
    "registra la ubicación física sin alterar el estado operativo manualmente",
    async () => {
      renderPage();
      await fillRequiredCreationFields();

      fireEvent.change(
        screen.getByLabelText("Ubicación física actual"),
        {
          target: { value: "TALLER_EXTERNO" },
        },
      );

      fireEvent.click(
        screen.getByRole("button", {
          name: "Registrar vehículo y compra",
        }),
      );

      await waitFor(() =>
        expect(mocks.createWithVehicle).toHaveBeenCalledWith(
          expect.objectContaining({
            vehiculo: expect.objectContaining({
              ubicacionActual: "TALLER_EXTERNO",
            }),
          }),
        ),
      );
    },
  );

  it("permite el ingreso sin matrícula ni VIN", async () => {
    renderPage();
    await fillRequiredCreationFields();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Registrar vehículo y compra",
      }),
    );

    await waitFor(() =>
      expect(mocks.createWithVehicle).toHaveBeenCalledWith(
        expect.objectContaining({
          vehiculo: expect.objectContaining({
            matricula: undefined,
            numeroChasis: undefined,
          }),
        }),
      ),
    );
  });

  it(
    "oculta observaciones internas para perfiles comerciales sin permiso gerencial",
    async () => {
      mocks.roles = ["VENDEDOR"];
      renderPage();

      await screen.findByRole("option", { name: /Ana Pérez/i });
      await screen.findByRole("option", { name: "Automóvil" });

      expect(
        screen.queryByLabelText("Observaciones internas"),
      ).not.toBeInTheDocument();
    },
  );

  it(
    "carga un vehículo existente y envía su actualización sin modificar la compra",
    async () => {
      renderPage("/app/vehiculos/4/editar");

      expect(
        await screen.findByDisplayValue("Corolla"),
      ).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText("Color"), {
        target: { value: "Gris" },
      });

      fireEvent.click(
        screen.getByRole("button", {
          name: "Guardar vehículo",
        }),
      );

      await waitFor(() =>
        expect(mocks.update).toHaveBeenCalledWith(
          4,
          expect.objectContaining({
            color: "Gris",
          }),
        ),
      );
    },
  );

  it(
    "mantiene el label exacto de un tipo dinámico desactivado al editar",
    async () => {
      mocks.get.mockResolvedValue({
        ...vehicle,
        tipoVehiculo: "UTE_DOBLE",
        tipoVehiculoLabel: "Utilitario doble cabina",
      });

      mocks.listByCategory.mockResolvedValue([]);

      renderPage("/app/vehiculos/4/editar");

      expect(
        await screen.findByRole("option", {
          name: "Utilitario doble cabina (histórico)",
        }),
      ).toBeInTheDocument();

      expect(
        screen.getByLabelText("Tipo de vehículo"),
      ).toHaveValue("UTE_DOBLE");
    },
  );
});