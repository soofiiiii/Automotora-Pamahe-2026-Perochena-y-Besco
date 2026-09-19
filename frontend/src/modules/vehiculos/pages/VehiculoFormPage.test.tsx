import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import VehiculoFormPage from "./VehiculoFormPage";

const mockCreate = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockNavigate = vi.hoisted(() => vi.fn());
const mockShow = vi.hoisted(() => vi.fn());
const mockGet = vi.hoisted(() => vi.fn());

let mockRoles: string[] = ["ADMINISTRADOR"];

vi.mock("../../../services/api", () => ({
  vehiculoService: {
    create: mockCreate,
    update: mockUpdate,
    get: mockGet,
  },
}));

vi.mock("../../../hooks/useAuth", () => ({
  useAuth: () => ({
    session: {
      roles: mockRoles,
    },
  }),
}));

vi.mock("../../../shared/feedback/useToast", () => ({
  useToast: () => ({
    show: mockShow,
  }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderForm() {
  return render(
    <MemoryRouter>
      <VehiculoFormPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();

  mockRoles = ["ADMINISTRADOR"];

  mockCreate.mockResolvedValue({});
  mockUpdate.mockResolvedValue({});
  mockGet.mockResolvedValue({});
});

describe("VehiculoFormPage", () => {
  it("muestra errores cuando los campos obligatorios están vacíos", async () => {
    const user = userEvent.setup();

    renderForm();

    await user.click(
      screen.getByRole("button", { name: "Guardar vehículo" }),
    );

    expect(await screen.findAllByText("Obligatorio")).toHaveLength(2);

    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("crea un vehículo y normaliza la matrícula", async () => {
    const user = userEvent.setup();

    renderForm();

    await user.type(screen.getByLabelText("Marca"), "Toyota");
    await user.type(screen.getByLabelText("Modelo"), "Corolla");
    await user.clear(screen.getByLabelText("Matrícula"));
    await user.type(screen.getByLabelText("Matrícula"), "abc123");

    await user.click(
      screen.getByRole("button", { name: "Guardar vehículo" }),
    );

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        marca: "Toyota",
        modelo: "Corolla",
        matricula: "ABC123",
      }),
    );

    expect(mockShow).toHaveBeenCalledWith(
      "Vehículo guardado.",
      "success",
    );

    expect(mockNavigate).toHaveBeenCalledWith("/app/vehiculos");
  });

  it("envía observaciones internas para un rol autorizado", async () => {
    const user = userEvent.setup();

    mockRoles = ["DUENO"];

    renderForm();

    await user.type(screen.getByLabelText("Marca"), "Toyota");
    await user.type(screen.getByLabelText("Modelo"), "Corolla");
    await user.type(screen.getByLabelText("Matrícula"), "ABC123");
    await user.type(
      screen.getByLabelText("Observaciones internas"),
      "Vehículo revisado",
    );

    await user.click(
      screen.getByRole("button", { name: "Guardar vehículo" }),
    );

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        observacionesInternas: "Vehículo revisado",
      }),
    );
  });

  it("no muestra ni envía observaciones internas para un rol no autorizado", async () => {
    const user = userEvent.setup();

    mockRoles = ["VENDEDOR"];

    renderForm();

    expect(
      screen.queryByLabelText("Observaciones internas"),
    ).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Marca"), "Toyota");
    await user.type(screen.getByLabelText("Modelo"), "Corolla");
    await user.type(screen.getByLabelText("Matrícula"), "ABC123");

    await user.click(
      screen.getByRole("button", { name: "Guardar vehículo" }),
    );

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.not.objectContaining({
        observacionesInternas: expect.anything(),
      }),
    );
  });
});