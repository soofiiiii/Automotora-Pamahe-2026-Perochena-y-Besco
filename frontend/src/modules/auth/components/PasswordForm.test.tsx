// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PasswordForm } from "./PasswordForm";

const onSave = vi.fn<
  (values: { passwordActual: string; nuevaPassword: string }) => Promise<void>
>();

beforeEach(() => {
  vi.clearAllMocks();
  onSave.mockResolvedValue();
});

afterEach(() => cleanup());

describe("PasswordForm", () => {
  it("valida longitud y confirmación antes de guardar", async () => {
    render(<PasswordForm label="Guardar clave" onSave={onSave} />);

    fireEvent.change(screen.getByLabelText("Nueva contraseña"), {
      target: { value: "corta" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar nueva contraseña"), {
      target: { value: "corta" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar clave" }));

    expect(
      await screen.findByText("La contraseña debe contener entre 8 y 72 caracteres."),
    ).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("exige la contraseña actual y evita reutilizarla", async () => {
    render(
      <PasswordForm requireCurrent label="Cambiar contraseña" onSave={onSave} />,
    );

    fireEvent.change(screen.getByLabelText("Contraseña actual"), {
      target: { value: "ClaveSegura2026" },
    });
    fireEvent.change(screen.getByLabelText("Nueva contraseña"), {
      target: { value: "ClaveSegura2026" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar nueva contraseña"), {
      target: { value: "ClaveSegura2026" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cambiar contraseña" }));

    expect(
      await screen.findByText("La contraseña nueva no puede ser igual a la actual."),
    ).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("envía los valores válidos y limpia los campos al finalizar", async () => {
    render(
      <PasswordForm requireCurrent label="Cambiar contraseña" onSave={onSave} />,
    );

    fireEvent.change(screen.getByLabelText("Contraseña actual"), {
      target: { value: "ClaveAnterior2026" },
    });
    fireEvent.change(screen.getByLabelText("Nueva contraseña"), {
      target: { value: "ClaveNueva2026" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar nueva contraseña"), {
      target: { value: "ClaveNueva2026" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cambiar contraseña" }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        passwordActual: "ClaveAnterior2026",
        nuevaPassword: "ClaveNueva2026",
      }),
    );
    expect(screen.getByLabelText("Contraseña actual")).toHaveValue("");
    expect(screen.getByLabelText("Nueva contraseña")).toHaveValue("");
    expect(screen.getByLabelText("Confirmar nueva contraseña")).toHaveValue("");
  });
});
