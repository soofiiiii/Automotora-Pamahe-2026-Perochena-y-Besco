import type { EstadoVehiculo, StockFilters } from "../types/vehiculo.types";
import { MAX_VEHICLE_YEAR, MIN_VEHICLE_YEAR } from "./vehicleYear";

export const VEHICLE_STATES: EstadoVehiculo[] = [
  "COMPRADO",
  "EN_TALLER",
  "DISPONIBLE",
  "RESERVADO",
  "VENDIDO",
  "DADO_DE_BAJA",
];
export const FILTER_KEYS = [
  "marca",
  "modelo",
  "tipoVehiculo",
  "anioDesde",
  "anioHasta",
  "precioMin",
  "precioMax",
  "estado",
  "publicado",
  "disponibleComercial",
] as const;
export type FilterDraft = Record<(typeof FILTER_KEYS)[number], string>;

export function filterDraft(params: URLSearchParams): FilterDraft {
  return {
    marca: params.get("marca") ?? params.get("q") ?? "",
    modelo: params.get("modelo") ?? "",
    tipoVehiculo: params.get("tipoVehiculo") ?? "",
    anioDesde: params.get("anioDesde") ?? "",
    anioHasta: params.get("anioHasta") ?? "",
    precioMin: params.get("precioMin") ?? "",
    precioMax: params.get("precioMax") ?? "",
    estado: params.get("estado") ?? "",
    publicado: params.get("publicado") ?? "",
    disponibleComercial: params.get("disponibleComercial") ?? "",
  };
}

export function parseVehicleFilters(
  params: URLSearchParams,
  internal = false,
  commercial = true,
): StockFilters {
  const draft = filterDraft(params);
  const result: StockFilters = {};
  for (const key of ["marca", "modelo", "tipoVehiculo"] as const) {
    const value = draft[key].trim();
    if (value.length > (key === "tipoVehiculo" ? 50 : 80))
      throw new Error(
        "La marca, el modelo o el tipo exceden la longitud admitida.",
      );
    if (value) result[key] = value;
  }
  for (const key of [
    "anioDesde",
    "anioHasta",
    "precioMin",
    "precioMax",
  ] as const) {
    if (!commercial && key.startsWith("precio")) continue;
    if (!draft[key]) continue;
    const value = Number(draft[key]);
    const year = key.startsWith("anio");
    if (
      !Number.isFinite(value) ||
      (year
        ? !Number.isInteger(value) || value < MIN_VEHICLE_YEAR || value > MAX_VEHICLE_YEAR
        : value < 0)
    ) {
      throw new Error(
        year
          ? `Ingresá años enteros entre ${MIN_VEHICLE_YEAR} y ${MAX_VEHICLE_YEAR}.`
          : "Los precios deben ser números mayores o iguales a cero.",
      );
    }
    result[key] = value;
  }
  if (
    result.anioDesde !== undefined &&
    result.anioHasta !== undefined &&
    result.anioDesde > result.anioHasta
  )
    throw new Error("El año inicial no puede ser mayor que el final.");
  if (
    result.precioMin !== undefined &&
    result.precioMax !== undefined &&
    result.precioMin > result.precioMax
  )
    throw new Error("El precio mínimo no puede ser mayor que el máximo.");
  if (internal) {
    if (draft.estado) {
      const state = VEHICLE_STATES.find((value) => value === draft.estado);
      if (!state) throw new Error("El estado del vehículo no es válido.");
      result.estado = state;
    }
    for (const key of ["publicado", "disponibleComercial"] as const) {
      if (key === "publicado" && !commercial) continue;
      if (!draft[key]) continue;
      if (!["true", "false"].includes(draft[key]))
        throw new Error(
          "El filtro de disponibilidad o publicación no es válido.",
        );
      result[key] = draft[key] === "true";
    }
    if (
      result.estado &&
      result.disponibleComercial !== undefined &&
      (result.estado === "DISPONIBLE") !== result.disponibleComercial
    ) {
      throw new Error(
        "El estado y la disponibilidad seleccionados se contradicen.",
      );
    }
  }
  return result;
}

export function serializeVehicleFilters(draft: FilterDraft): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS)
    if (draft[key].trim()) params.set(key, draft[key].trim());
  return params;
}
