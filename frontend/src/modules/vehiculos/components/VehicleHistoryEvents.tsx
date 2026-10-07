import { useId } from "react";
import type { HistorialEventoVehiculo } from "../../../types/vehiculo.types";
import "./VehicleHistoryEvents.css";

interface VehicleHistoryEventsProps {
  eventos: readonly HistorialEventoVehiculo[];
}

const eventLabels = new Map<string, string>([
  ["CAMBIO_ESTADO", "Cambio de estado"],
  ["CAMBIO_PUBLICACION", "Cambio de publicación"],
]);

const dateTimeFormatter = new Intl.DateTimeFormat("es-UY", {
  dateStyle: "medium",
  timeStyle: "medium",
});

export function VehicleHistoryEvents({ eventos }: VehicleHistoryEventsProps) {
  const titleId = useId();
  // Ordenamos una copia y preservamos el orden recibido en empates.
  const orderedEvents = eventos
    .map((event, index) => {
      const timestamp = Date.parse(event.creadoEn);
      return {
        event,
        index,
        timestamp: Number.isFinite(timestamp) ? timestamp : null,
      };
    })
    .sort((a, b) => {
      if (a.timestamp === b.timestamp) return a.index - b.index;
      if (a.timestamp === null) return 1;
      if (b.timestamp === null) return -1;
      return a.timestamp - b.timestamp;
    });

  return (
    <section aria-labelledby={titleId} className="vehicle-history-events">
      <h3 id={titleId}>Cambios de estado y publicación</h3>
      {orderedEvents.length === 0 ? (
        <p className="muted">
          No hay cambios de estado o publicación registrados.
        </p>
      ) : (
        <>
          <p className="muted">Del más antiguo al más reciente.</p>
          <ol
            className="vehicle-history-events__list"
            aria-labelledby={titleId}
          >
            {orderedEvents.map(({ event, index, timestamp }) => (
              <li className="vehicle-history-events__item" key={index}>
                <strong>
                  {eventLabels.get(event.accion) ??
                    (event.accion.replaceAll("_", " ") ||
                      "Evento del vehículo")}
                </strong>
                <p className="muted">
                  {timestamp === null ? (
                    "Fecha no disponible"
                  ) : (
                    <time dateTime={event.creadoEn}>
                      {dateTimeFormatter.format(timestamp)}
                    </time>
                  )}
                </p>
                <p>Usuario: {event.usuario?.trim() || "No informado"}</p>
                <p className="vehicle-history-events__detail">
                  {event.detalle?.trim() || "Sin detalle adicional."}
                </p>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
