import { vehicleTypeLabel } from "../../config/vehicleTypes";
import { useVehicleTypeOptions } from "../../hooks/useVehicleTypeOptions";

export function VehicleTypeField({ value, currentLabel, onChange, emptyLabel = "Todos" }: {
  value: string;
  currentLabel?: string | null;
  onChange: (value: string) => void;
  emptyLabel?: string;
}) {
  const { options, loading, error } = useVehicleTypeOptions();
  const normalizedValue = value.trim().toUpperCase();
  const currentIsActive = options.some((item) => item.value === normalizedValue);
  const historicalOption = normalizedValue && !currentIsActive
    ? { value: normalizedValue, label: `${currentLabel?.trim() || vehicleTypeLabel(normalizedValue)} (histórico)` }
    : null;

  return (
    <div className="field">
      <label>
        <span>Tipo de vehículo</span>
        <select
          value={normalizedValue}
          onChange={(event) => onChange(event.target.value)}
          disabled={loading && !historicalOption}
        >
          <option value="">{loading ? "Cargando tipos…" : emptyLabel}</option>
          {historicalOption && <option value={historicalOption.value}>{historicalOption.label}</option>}
          {options.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </label>
      {error && <small className="field__error" role="alert">No pudimos actualizar los tipos de vehículo. Intentá nuevamente.</small>}
    </div>
  );
}