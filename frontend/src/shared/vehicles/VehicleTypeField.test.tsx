// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VehicleTypeField } from "./VehicleTypeField";

const mocks = vi.hoisted(() => ({ listByCategory: vi.fn() }));
vi.mock("../../services/api", () => ({ parametroService: { listByCategory: mocks.listByCategory } }));

beforeEach(() => {
  mocks.listByCategory.mockResolvedValue([
    { id: 1, categoria: "TIPO_VEHICULO", clave: "AUTO", valor: "Automóvil", descripcion: null, activo: true },
    { id: 2, categoria: "TIPO_VEHICULO", clave: "SUV", valor: "SUV", descripcion: null, activo: true },
  ]);
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("VehicleTypeField CF-03", () => {
  it("ofrece los tipos activos recibidos de la API y no una constante local", async () => {
    const onChange = vi.fn();
    render(<VehicleTypeField value="" onChange={onChange} />);

    expect(await screen.findByRole("option", { name: "Automóvil" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "SUV" })).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "SUV" } });
    expect(onChange).toHaveBeenCalledWith("SUV");
  });

  it("conserva exactamente el label dinámico de un tipo histórico desactivado", async () => {
    render(
      <VehicleTypeField
        value="UTE_DOBLE"
        currentLabel="Utilitario doble cabina"
        onChange={vi.fn()}
      />,
    );
    expect(
      await screen.findByRole("option", { name: "Utilitario doble cabina (histórico)" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveValue("UTE_DOBLE");
  });
});
