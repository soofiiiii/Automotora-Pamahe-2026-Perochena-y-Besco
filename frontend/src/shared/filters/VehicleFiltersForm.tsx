import { useState } from "react";
import { Search, X } from "lucide-react";
import { VehicleTypeField } from "../vehicles/VehicleTypeField";
import { MAX_VEHICLE_YEAR, MIN_VEHICLE_YEAR } from "../../utils/vehicleYear";
import {
  filterDraft,
  parseVehicleFilters,
  serializeVehicleFilters,
  VEHICLE_STATES,
  type FilterDraft,
} from "../../utils/vehicleFilters";

export function VehicleFiltersForm({
  params,
  internal = false,
  commercial = true,
  onApply,
}: {
  params: URLSearchParams;
  internal?: boolean;
  commercial?: boolean;
  onApply: (params: URLSearchParams) => void;
}) {
  const [draft, setDraft] = useState(() => filterDraft(params));
  const [error, setError] = useState("");
  const set = (key: keyof FilterDraft, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));
  return (
    <form
      className={
        internal ? "toolbar vehicle-filters" : "catalog-filters vehicle-filters"
      }
      onSubmit={(event) => {
        event.preventDefault();
        try {
          const next = serializeVehicleFilters(draft);
          parseVehicleFilters(next, internal, commercial);
          setError("");
          onApply(next);
        } catch (cause) {
          setError(
            cause instanceof Error ? cause.message : "Revisá los filtros.",
          );
        }
      }}
    >
      <label className="field">
        <span>Marca</span>
        <input
          value={draft.marca}
          maxLength={80}
          onChange={(event) => set("marca", event.target.value)}
          placeholder="Ej. Toyota"
        />
      </label>
      <label className="field">
        <span>Modelo</span>
        <input
          value={draft.modelo}
          maxLength={80}
          onChange={(event) => set("modelo", event.target.value)}
          placeholder="Ej. Corolla"
        />
      </label>
      <VehicleTypeField
        value={draft.tipoVehiculo}
        onChange={(value) => set("tipoVehiculo", value)}
      />
      {(
        [
          ["anioDesde", "Año desde"],
          ["anioHasta", "Año hasta"],
        ] as const
      ).map(([key, label]) => (
        <label className="field" key={key}>
          <span>{label}</span>
          <input
            type="number"
            min={MIN_VEHICLE_YEAR}
            max={MAX_VEHICLE_YEAR}
            step={1}
            value={draft[key]}
            onChange={(event) => set(key, event.target.value)}
          />
        </label>
      ))}
      {commercial &&
        (
          [
            ["precioMin", "Precio mínimo (UYU)"],
            ["precioMax", "Precio máximo (UYU)"],
          ] as const
        ).map(([key, label]) => (
          <label className="field" key={key}>
            <span>{label}</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={draft[key]}
              onChange={(event) => set(key, event.target.value)}
            />
          </label>
        ))}
      {internal && (
        <>
          <label className="field">
            <span>Estado operativo</span>
            <select
              value={draft.estado}
              onChange={(event) => set("estado", event.target.value)}
            >
              <option value="">Todos</option>
              {VEHICLE_STATES.map((state) => (
                <option value={state} key={state}>
                  {state.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Disponibilidad comercial</span>
            <select
              value={draft.disponibleComercial}
              onChange={(event) =>
                set("disponibleComercial", event.target.value)
              }
            >
              <option value="">Todas</option>
              <option value="true">Disponibles para venta</option>
              <option value="false">No disponibles para venta</option>
            </select>
          </label>
          {commercial && (
            <label className="field">
              <span>Publicación</span>
              <select
                value={draft.publicado}
                onChange={(event) => set("publicado", event.target.value)}
              >
                <option value="">Todas</option>
                <option value="true">Publicado</option>
                <option value="false">No publicado</option>
              </select>
            </label>
          )}
        </>
      )}
      <div className="actions-row">
        <button className="button button--accent" type="submit">
          <Search size={17} />
          Aplicar
        </button>
        <button
          className="button button--secondary"
          type="button"
          onClick={() => {
            setDraft(filterDraft(new URLSearchParams()));
            setError("");
            onApply(new URLSearchParams());
          }}
        >
          <X size={17} />
          Limpiar
        </button>
      </div>
      {error && (
        <p className="notice notice--warning filters-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
