import { useId, type ComponentProps } from "react";
import { ChevronDown } from "lucide-react";
import type { CatalogFilterState } from "../hooks/useCatalogFilters";
import { cx, fieldControl, fieldLabel } from "./catalogStyles";

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from(
  { length: currentYear - 1899 },
  (_, index) => currentYear - index,
);

function NativeSelect({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select {...props} className={cx(fieldControl, "h-12 appearance-none pr-10", className)}>
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-brand"
      />
    </div>
  );
}

const digitsToNumber = (raw: string) => {
  const digits = raw.replace(/\D/g, "");
  return digits ? Number(digits) : null;
};

export function FilterFields({
  state,
  layout,
}: {
  state: CatalogFilterState;
  layout: "row" | "stack";
}) {
  const { filters, patch } = state;
  const uid = useId();

  return (
    <div className={layout === "row" ? "grid gap-3 lg:grid-cols-[1fr_1fr_1.2fr_1.2fr]" : "grid gap-5"}>
      <div className="grid content-start gap-1.5">
        <label htmlFor={`${uid}-marca`} className={fieldLabel}>Marca</label>
        <input
          id={`${uid}-marca`}
          type="search"
          autoComplete="off"
          value={filters.marca}
          onChange={(event) => patch({ marca: event.target.value, modelo: "" })}
          placeholder="Ej. Toyota"
          className={cx(fieldControl, "h-12")}
        />
      </div>

      <div className="grid content-start gap-1.5">
        <label htmlFor={`${uid}-modelo`} className={fieldLabel}>Modelo</label>
        <input
          id={`${uid}-modelo`}
          type="search"
          autoComplete="off"
          value={filters.modelo}
          onChange={(event) => patch({ modelo: event.target.value })}
          placeholder="Ej. Corolla"
          className={cx(fieldControl, "h-12")}
        />
      </div>

      <div role="group" aria-labelledby={`${uid}-anio`} className="grid content-start gap-1.5">
        <span id={`${uid}-anio`} className={fieldLabel}>Año</span>
        <div className="grid grid-cols-2 gap-2">
          <NativeSelect
            aria-label="Año desde"
            value={filters.anioDesde ?? ""}
            onChange={(event) => patch({ anioDesde: event.target.value ? Number(event.target.value) : null })}
          >
            <option value="">Desde</option>
            {YEAR_OPTIONS.map((year) => <option key={year} value={year}>{year}</option>)}
          </NativeSelect>
          <NativeSelect
            aria-label="Año hasta"
            value={filters.anioHasta ?? ""}
            onChange={(event) => patch({ anioHasta: event.target.value ? Number(event.target.value) : null })}
          >
            <option value="">Hasta</option>
            {YEAR_OPTIONS.map((year) => <option key={year} value={year}>{year}</option>)}
          </NativeSelect>
        </div>
      </div>

      <div role="group" aria-labelledby={`${uid}-precio`} className="grid content-start gap-1.5">
        <span id={`${uid}-precio`} className={fieldLabel}>Precio</span>
        <div className="grid grid-cols-2 gap-2">
          <input
            aria-label="Precio mínimo"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Desde"
            value={filters.min ?? ""}
            onChange={(event) => patch({ min: digitsToNumber(event.target.value) })}
            className={cx(fieldControl, "h-12")}
          />
          <input
            aria-label="Precio máximo"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Hasta"
            value={filters.max ?? ""}
            onChange={(event) => patch({ max: digitsToNumber(event.target.value) })}
            className={cx(fieldControl, "h-12")}
          />
        </div>
      </div>
    </div>
  );
}
