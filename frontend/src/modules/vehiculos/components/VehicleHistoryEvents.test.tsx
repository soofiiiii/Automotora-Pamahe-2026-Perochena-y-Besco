// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import type { HistorialEventoVehiculo } from "../../../types/vehiculo.types";
import { VehicleHistoryEvents } from "./VehicleHistoryEvents";

afterEach(cleanup);

const stateEvent: HistorialEventoVehiculo = {
  creadoEn: "2026-09-20T09:30:00-03:00",
  usuario: "Sophie",
  accion: "CAMBIO_ESTADO",
  detalle: "Estado actualizado de COMPRADO a EN_TALLER.",
  valoresAnteriores: '{"estado":"COMPRADO","costoInicial":900000}',
  valoresNuevos:
    '{"estado":"EN_TALLER","observacionesInternas":"Dato reservado"}',
};
const publicationEvent: HistorialEventoVehiculo = {
  ...stateEvent,
  creadoEn: "2026-09-20T10:30:00-03:00",
  accion: "CAMBIO_PUBLICACION",
  detalle: "Vehículo publicado en catálogo.",
};

describe("eventos del historial", () => {
  it("muestra fecha, usuario, acción y detalle en orden cronológico sin mutar la respuesta", () => {
    const events = Object.freeze([publicationEvent, stateEvent]);
    render(<VehicleHistoryEvents eventos={events} />);
    const items = screen.getAllByRole("listitem");
    expect(within(items[0]).getByText("Cambio de estado")).toBeTruthy();
    expect(within(items[1]).getByText("Cambio de publicación")).toBeTruthy();
    expect(within(items[0]).getByText("Usuario: Sophie")).toBeTruthy();
    expect(within(items[0]).getByText(stateEvent.detalle!)).toBeTruthy();
    expect(items[0].querySelector("time")?.dateTime).toBe(stateEvent.creadoEn);
    expect(events[0]).toBe(publicationEvent);
  });

  it("ordena por instante incluso cuando los eventos usan distintos offsets", () => {
    render(
      <VehicleHistoryEvents
        eventos={[
          { ...stateEvent, creadoEn: "2026-09-20T10:00:00-03:00" },
          { ...publicationEvent, creadoEn: "2026-09-20T12:00:00Z" },
        ]}
      />,
    );
    expect(
      within(screen.getAllByRole("listitem")[0]).getByText(
        "Cambio de publicación",
      ),
    ).toBeTruthy();
  });

  it("mantiene el orden recibido cuando coinciden las fechas", () => {
    render(
      <VehicleHistoryEvents
        eventos={[
          stateEvent,
          { ...publicationEvent, creadoEn: stateEvent.creadoEn },
        ]}
      />,
    );
    expect(
      within(screen.getAllByRole("listitem")[0]).getByText("Cambio de estado"),
    ).toBeTruthy();
  });

  it("muestra el estado vacío cuando el backend devuelve la lista sin eventos", () => {
    render(<VehicleHistoryEvents eventos={[]} />);
    expect(
      screen.getByText("No hay cambios de estado o publicación registrados."),
    ).toBeTruthy();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("no falla por fecha inválida ni por detalle o usuario ausentes", () => {
    render(
      <VehicleHistoryEvents
        eventos={[
          {
            ...stateEvent,
            creadoEn: "fecha-invalida",
            detalle: null,
            usuario: null,
          },
          publicationEvent,
        ]}
      />,
    );
    const items = screen.getAllByRole("listitem");
    expect(within(items[1]).getByText("Fecha no disponible")).toBeTruthy();
    expect(within(items[1]).getByText("Usuario: No informado")).toBeTruthy();
    expect(within(items[1]).getByText("Sin detalle adicional.")).toBeTruthy();
    expect(items[1].querySelector("time")).toBeNull();
  });

  it("no interpreta snapshots ni inyecta HTML en el detalle", () => {
    const detail = '<img src=x onerror="alert(1)">';
    const { container } = render(
      <VehicleHistoryEvents eventos={[{ ...stateEvent, detalle: detail }]} />,
    );
    expect(screen.getByText(detail)).toBeTruthy();
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).not.toContain("900000");
    expect(container.textContent).not.toContain("Dato reservado");
    expect(container.textContent).not.toContain("observacionesInternas");
  });

  it("conserva eventos adicionales del contrato sin reconstruir su contenido", () => {
    render(
      <VehicleHistoryEvents
        eventos={[{ ...stateEvent, accion: "BAJA_LOGICA" }]}
      />,
    );
    expect(screen.getByText("BAJA LOGICA")).toBeTruthy();
    expect(screen.getByText(stateEvent.detalle!)).toBeTruthy();
  });
});
