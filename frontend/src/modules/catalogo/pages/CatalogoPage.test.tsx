import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CatalogoPage from "./CatalogoPage";

const mockList = vi.hoisted(() => vi.fn());

vi.mock("../../../services/api", () => ({
  catalogoService: {
    list: mockList,
  },
}));

vi.mock("../components/VehicleCard", () => ({
  default: ({ vehicle }: { vehicle: { marca: string; modelo: string } }) => (
    <div>
      {vehicle.marca} {vehicle.modelo}
    </div>
  ),
}));

const vehicles = [
  {
    id: 3,
    marca: "Toyota",
    modelo: "Corolla",
    anio: 2022,
    color: "Blanco",
    precioVentaEstimado: 25000,
  },
  {
    id: 2,
    marca: "Ford",
    modelo: "Focus",
    anio: 2020,
    color: "Negro",
    precioVentaEstimado: 18000,
  },
  {
    id: 1,
    marca: "Chevrolet",
    modelo: "Onix",
    anio: 2023,
    color: "Rojo",
    precioVentaEstimado: 22000,
  },
];

function renderCatalogo() {
  return render(
    <MemoryRouter>
      <CatalogoPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockList.mockResolvedValue(vehicles);
});

describe("CatalogoPage", () => {
  it("carga y muestra los vehículos disponibles", async () => {
    renderCatalogo();

    expect(
      await screen.findByText("Toyota Corolla"),
    ).toBeInTheDocument();

    expect(screen.getByText("Ford Focus")).toBeInTheDocument();
    expect(screen.getByText("Chevrolet Onix")).toBeInTheDocument();

    expect(mockList).toHaveBeenCalledWith({});
  });

  it("filtra los vehículos por búsqueda", async () => {
    const user = userEvent.setup();

    renderCatalogo();

    await screen.findByText("Toyota Corolla");

    const searchInput = screen.getByPlaceholderText("Marca o modelo");

    await user.type(searchInput, "Toyota");

    expect(screen.getByText("Toyota Corolla")).toBeInTheDocument();
    expect(screen.queryByText("Ford Focus")).not.toBeInTheDocument();
    expect(screen.queryByText("Chevrolet Onix")).not.toBeInTheDocument();
  });

  it("envía los filtros seleccionados al servicio", async () => {
    const user = userEvent.setup();

    renderCatalogo();

    await screen.findByText("Toyota Corolla");

    const marcaInput = screen.getByPlaceholderText("Ej. Toyota");
    const modeloInput = screen.getByPlaceholderText("Ej. Corolla");

    await user.type(marcaInput, "Toyota");
    await user.type(modeloInput, "Corolla");

    await user.click(screen.getByRole("button", { name: /Buscar/i }));

    await waitFor(() => {
      expect(mockList).toHaveBeenLastCalledWith({
        marca: "Toyota",
        modelo: "Corolla",
        anioDesde: undefined,
        anioHasta: undefined,
      });
    });
  });

  it("permite ordenar los vehículos por precio de menor a mayor", async () => {
    const user = userEvent.setup();

    renderCatalogo();

    await screen.findByText("Toyota Corolla");

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Ordenar" }),
      "precio-asc",
    );

    const vehicleTexts = screen
      .getAllByText(/Toyota Corolla|Ford Focus|Chevrolet Onix/)
      .map((element) => element.textContent);

    expect(vehicleTexts).toEqual([
      "Ford Focus",
      "Chevrolet Onix",
      "Toyota Corolla",
    ]);
  });
});