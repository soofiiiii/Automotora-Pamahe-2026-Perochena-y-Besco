// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { PageResult } from "../../../types/api.types";
import type { CatalogoVehiculo } from "../../../types/vehiculo.types";
import CatalogoPage from "./CatalogoPage";

const mocks = vi.hoisted(() => ({
  page: vi.fn<
    (params?: Record<string, unknown>, signal?: AbortSignal) => Promise<PageResult<CatalogoVehiculo>>
  >(),
  listByCategory: vi.fn(),
}));

vi.mock("../../../services/api", () => ({
  catalogoService: { page: mocks.page },
  parametroService: { listByCategory: mocks.listByCategory },
}));

vi.mock("../../../shared/seo/SeoMeta", () => ({
  SeoMeta: () => null,
}));

const vehicles: CatalogoVehiculo[] = [
  {
    id: 12,
    marca: "Toyota",
    modelo: "Corolla",
    tipoVehiculo: "AUTO",
    tipoVehiculoLabel: "Automóvil",
    anio: 2022,
    estado: "DISPONIBLE",
    color: "Blanco",
    kilometraje: 45000,
    precioVentaEstimado: 890000,
    descripcionPublica: "Sedán disponible",
    imagenes: [],
  },
  {
    id: 11,
    marca: "Renault",
    modelo: "Duster",
    tipoVehiculo: "SUV",
    tipoVehiculoLabel: "SUV",
    anio: 2021,
    estado: "RESERVADO",
    color: "Gris",
    kilometraje: 52000,
    precioVentaEstimado: 970000,
    imagenes: [],
  },
];

const pageResult = (overrides: Partial<PageResult<CatalogoVehiculo>> = {}): PageResult<CatalogoVehiculo> => ({
  content: vehicles,
  number: 0,
  size: 12,
  totalElements: 24,
  totalPages: 2,
  serverPaged: true,
  ...overrides,
});

function renderPage(initialEntry = "/catalogo") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/catalogo" element={<CatalogoPage />} />
        <Route path="/catalogo/:id" element={<div>Detalle público</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.page.mockResolvedValue(pageResult());
  mocks.listByCategory.mockResolvedValue([
    { id: 1, categoria: "TIPO_VEHICULO", clave: "AUTO", valor: "Automóvil", descripcion: null, activo: true },
    { id: 2, categoria: "TIPO_VEHICULO", clave: "SUV", valor: "SUV", descripcion: null, activo: true },
  ]);
  Object.defineProperty(window, "scrollTo", {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(() => cleanup());

describe("CatalogoPage", () => {
  it("consulta el catálogo y presenta los vehículos recibidos", async () => {
    renderPage();

    expect(await screen.findByText("Toyota Corolla")).toBeInTheDocument();
    expect(screen.getByText("Renault Duster")).toBeInTheDocument();
    expect(screen.getByText("Reservado")).toBeInTheDocument();
    expect(mocks.page).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 0,
        size: 12,
        sort: "id,desc",
      }),
      expect.any(AbortSignal),
    );
  });


  it("envía al servidor los filtros definidos en la URL sin volver a filtrar la respuesta en memoria", async () => {
    renderPage(
      "/catalogo?marca=Toyota&modelo=Corolla&tipoVehiculo=AUTO&anioDesde=2020&anioHasta=2024&precioMin=500000&precioMax=1000000",
    );

    expect(await screen.findByText("Toyota Corolla")).toBeInTheDocument();
    expect(screen.getByText("Renault Duster")).toBeInTheDocument();

    expect(mocks.page).toHaveBeenLastCalledWith(
      expect.objectContaining({
        marca: "Toyota",
        modelo: "Corolla",
        tipoVehiculo: "AUTO",
        anioDesde: 2020,
        anioHasta: 2024,
        precioMin: 500000,
        precioMax: 1000000,
        page: 0,
      }),
      expect.any(AbortSignal),
    );

    expect(screen.getByLabelText("Marca")).toHaveValue("Toyota");
    expect(screen.getByLabelText("Modelo")).toHaveValue("Corolla");
  });

  it("vuelve a consultar el servidor cuando cambia un filtro del catálogo", async () => {
    renderPage();
    await screen.findByText("Toyota Corolla");

    fireEvent.change(screen.getByLabelText("Marca"), {
      target: { value: "Toyota" },
    });

    await waitFor(() =>
      expect(mocks.page).toHaveBeenLastCalledWith(
        expect.objectContaining({ marca: "Toyota", page: 0 }),
        expect.any(AbortSignal),
      ),
    );

    fireEvent.click(screen.getByLabelText("SUV"));

    await waitFor(() =>
      expect(mocks.page).toHaveBeenLastCalledWith(
        expect.objectContaining({
          marca: "Toyota",
          tipoVehiculo: "SUV",
          page: 0,
        }),
        expect.any(AbortSignal),
      ),
    );
  });

  it("reinicia la paginación al modificar filtros", async () => {
    renderPage("/catalogo?page=2");
    await screen.findByText("Toyota Corolla");

    fireEvent.change(screen.getByLabelText("Precio mínimo"), {
      target: { value: "700000" },
    });

    await waitFor(() =>
      expect(mocks.page).toHaveBeenLastCalledWith(
        expect.objectContaining({ precioMin: 700000, page: 0 }),
        expect.any(AbortSignal),
      ),
    );
  });

  it("actualiza la consulta cuando cambia el orden solicitado", async () => {
    renderPage();
    await screen.findByText("Toyota Corolla");

    fireEvent.change(screen.getByLabelText("Ordenar"), {
      target: { value: "precio-asc" },
    });

    await waitFor(() =>
      expect(mocks.page).toHaveBeenLastCalledWith(
        expect.objectContaining({
          page: 0,
          sort: "precioVentaEstimado,asc",
        }),
        expect.any(AbortSignal),
      ),
    );
  });

  it("solicita la página siguiente desde la paginación del servidor", async () => {
    mocks.page
      .mockResolvedValueOnce(pageResult())
      .mockResolvedValue(pageResult({ number: 1 }));
    renderPage();
    await screen.findByText("Toyota Corolla");

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    await waitFor(() =>
      expect(mocks.page).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 1, size: 12 }),
        expect.any(AbortSignal),
      ),
    );
    expect(window.scrollTo).toHaveBeenCalled();
  });

  it("permite reintentar una consulta fallida", async () => {
    mocks.page
      .mockRejectedValueOnce(new Error("No se pudo cargar el catálogo"))
      .mockResolvedValueOnce(pageResult());
    renderPage();

    expect(await screen.findByText("No se pudo cargar el catálogo")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Reintentar/i }));

    expect(await screen.findByText("Toyota Corolla")).toBeInTheDocument();
    expect(mocks.page).toHaveBeenCalledTimes(2);
  });
});
