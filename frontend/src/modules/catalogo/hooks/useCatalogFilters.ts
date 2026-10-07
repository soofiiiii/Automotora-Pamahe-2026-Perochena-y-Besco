import { useCallback, useMemo } from "react";
import { vehicleTypeLabel, type VehicleTypeOption } from "../../../config/vehicleTypes";

export type SortKey = "recientes" | "anio-desc" | "precio-asc" | "precio-desc";

export const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "recientes", label: "Más recientes" },
  { value: "anio-desc", label: "Año: mayor a menor" },
  { value: "precio-asc", label: "Precio: menor a mayor" },
  { value: "precio-desc", label: "Precio: mayor a menor" },
];

export interface CatalogFilters {
  q: string;
  marca: string;
  modelo: string;
  anioDesde: number | null;
  anioHasta: number | null;
  min: number | null;
  max: number | null;
  tipo: string;
  sort: SortKey;
}

const FILTER_PARAM_KEYS = [
  "q",
  "marca",
  "modelo",
  "tipoVehiculo",
  "anioDesde",
  "anioHasta",
  "precioMin",
  "precioMax",
  "sort",
] as const;

const readOptionalNumber = (value: string | null) => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const readVehicleType = (value: string | null): string =>
  value?.trim().toUpperCase() ?? "";

const readSort = (value: string | null): SortKey =>
  SORT_OPTIONS.some((option) => option.value === value)
    ? (value as SortKey)
    : "recientes";

const setStringParam = (
  params: URLSearchParams,
  key: string,
  value: string | null | undefined,
) => {
  const normalized = value?.trim() ?? "";
  if (normalized) params.set(key, normalized);
  else params.delete(key);
};

const setNumberParam = (
  params: URLSearchParams,
  key: string,
  value: number | null | undefined,
) => {
  if (value === null || value === undefined) params.delete(key);
  else params.set(key, String(value));
};

export interface ActiveChip {
  key: string;
  label: string;
  clear: () => void;
}

export function useCatalogFilters(
  searchParams: URLSearchParams,
  updateSearchParams: (next: URLSearchParams) => void,
  resultCount: number,
  vehicleTypes: readonly VehicleTypeOption[] = [],
) {
  const filters = useMemo<CatalogFilters>(
    () => ({
      q: searchParams.get("q") ?? "",
      marca: searchParams.get("marca") ?? "",
      modelo: searchParams.get("modelo") ?? "",
      anioDesde: readOptionalNumber(searchParams.get("anioDesde")),
      anioHasta: readOptionalNumber(searchParams.get("anioHasta")),
      min: readOptionalNumber(searchParams.get("precioMin")),
      max: readOptionalNumber(searchParams.get("precioMax")),
      tipo: readVehicleType(searchParams.get("tipoVehiculo")),
      sort: readSort(searchParams.get("sort")),
    }),
    [searchParams],
  );

  const patch = useCallback(
    (changes: Partial<CatalogFilters>) => {
      const next = new URLSearchParams(searchParams);

      if (Object.prototype.hasOwnProperty.call(changes, "q")) {
        setStringParam(next, "q", changes.q);
        if (changes.q?.trim()) {
          next.delete("marca");
          next.delete("modelo");
        }
      }

      if (Object.prototype.hasOwnProperty.call(changes, "marca")) {
        setStringParam(next, "marca", changes.marca);
        if (changes.marca?.trim()) next.delete("q");
      }

      if (Object.prototype.hasOwnProperty.call(changes, "modelo")) {
        setStringParam(next, "modelo", changes.modelo);
      }

      if (Object.prototype.hasOwnProperty.call(changes, "tipo")) {
        setStringParam(next, "tipoVehiculo", changes.tipo);
      }

      if (Object.prototype.hasOwnProperty.call(changes, "anioDesde")) {
        setNumberParam(next, "anioDesde", changes.anioDesde);
      }

      if (Object.prototype.hasOwnProperty.call(changes, "anioHasta")) {
        setNumberParam(next, "anioHasta", changes.anioHasta);
      }

      if (Object.prototype.hasOwnProperty.call(changes, "min")) {
        setNumberParam(next, "precioMin", changes.min);
      }

      if (Object.prototype.hasOwnProperty.call(changes, "max")) {
        setNumberParam(next, "precioMax", changes.max);
      }

      if (Object.prototype.hasOwnProperty.call(changes, "sort")) {
        if (!changes.sort || changes.sort === "recientes") next.delete("sort");
        else next.set("sort", changes.sort);
      }

      next.delete("page");
      updateSearchParams(next);
    },
    [searchParams, updateSearchParams],
  );

  const reset = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    for (const key of FILTER_PARAM_KEYS) next.delete(key);
    next.delete("page");
    updateSearchParams(next);
  }, [searchParams, updateSearchParams]);

  const activeChips = useMemo<ActiveChip[]>(() => {
    const chips: ActiveChip[] = [];
    if (filters.q) {
      chips.push({
        key: "q",
        label: `Marca: ${filters.q}`,
        clear: () => patch({ q: "" }),
      });
    }
    if (filters.marca) {
      chips.push({
        key: "marca",
        label: `Marca: ${filters.marca}`,
        clear: () => patch({ marca: "", modelo: "" }),
      });
    }
    if (filters.modelo) {
      chips.push({
        key: "modelo",
        label: `Modelo: ${filters.modelo}`,
        clear: () => patch({ modelo: "" }),
      });
    }
    if (filters.tipo) {
      chips.push({
        key: "tipo",
        label: vehicleTypeLabel(filters.tipo, vehicleTypes),
        clear: () => patch({ tipo: "" }),
      });
    }
    if (filters.anioDesde) {
      chips.push({
        key: "anioDesde",
        label: `Desde ${filters.anioDesde}`,
        clear: () => patch({ anioDesde: null }),
      });
    }
    if (filters.anioHasta) {
      chips.push({
        key: "anioHasta",
        label: `Hasta ${filters.anioHasta}`,
        clear: () => patch({ anioHasta: null }),
      });
    }
    if (filters.min !== null) {
      chips.push({
        key: "min",
        label: `Desde $ ${filters.min.toLocaleString("es-UY")}`,
        clear: () => patch({ min: null }),
      });
    }
    if (filters.max !== null) {
      chips.push({
        key: "max",
        label: `Hasta $ ${filters.max.toLocaleString("es-UY")}`,
        clear: () => patch({ max: null }),
      });
    }
    return chips;
  }, [filters, patch, vehicleTypes]);

  const sheetCount = [
    filters.marca,
    filters.modelo,
    filters.anioDesde,
    filters.anioHasta,
    filters.min,
    filters.max,
    filters.tipo,
  ].filter((value) => value !== "" && value !== null).length;

  return {
    filters,
    patch,
    reset,
    resultCount,
    activeChips,
    sheetCount,
    vehicleTypes,
  };
}

export type CatalogFilterState = ReturnType<typeof useCatalogFilters>;
