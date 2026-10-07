export interface VehicleTypeOption {
  value: string;
  label: string;
}

/** Compatibilidad visual para registros históricos creados antes de parametrizar TIPO_VEHICULO. */
const LEGACY_VEHICLE_TYPE_LABELS: Readonly<Record<string, string>> = {
  AUTO: "Automóvil",
  SUV: "SUV",
  CAMIONETA: "Camioneta",
  UTILITARIO: "Utilitario",
};

const humanize = (value: string) =>
  value
    .replaceAll("_", " ")
    .toLocaleLowerCase("es-UY")
    .replace(/^./, (letter) => letter.toLocaleUpperCase("es-UY"));

export const vehicleTypeLabel = (
  value?: string | null,
  options: readonly VehicleTypeOption[] = [],
) => {
  if (!value) return "Sin especificar";
  const normalized = value.trim().toUpperCase();
  return (
    options.find((type) => type.value === normalized)?.label ??
    LEGACY_VEHICLE_TYPE_LABELS[normalized] ??
    humanize(normalized)
  );
};
