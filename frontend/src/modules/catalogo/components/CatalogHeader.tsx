import { useRef, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { CatalogFilterState } from "../hooks/useCatalogFilters";
import { cx, fieldControl } from "./catalogStyles";
import {
  CATALOG_FILTER_DIALOG_ID,
  FilterSheet,
} from "./FilterSheet";

const CATALOG_HERO_IMAGE = "/images/catalogo/hero-catalogo.webp";

export function CatalogHeader({ state }: { state: CatalogFilterState }) {
  const {
    filters,
    patch,
    reset,
    resultCount,
    activeChips,
    sheetCount,
  } = state;

  const [sheetOpen, setSheetOpen] = useState(false);
  const filterTriggerRef = useRef<HTMLButtonElement>(null);

  const count = resultCount;

  return (
    <section aria-labelledby="catalogo-titulo">
      {/* Hero del catálogo */}
      <div
        data-surface="dark"
        className="relative isolate overflow-hidden bg-brand-deep text-white"
      >
        {/* Imagen de fondo */}
        <img
          src={CATALOG_HERO_IMAGE}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-30 h-full w-full object-cover object-center"
        />

        {/* Overlay principal */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-brand-deep/75"
        />

        {/* Degradado para reforzar legibilidad */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-deep/20 via-transparent to-brand-deep/35"
        />

        <div className="mx-auto w-full max-w-[1320px] px-4 py-14 sm:px-6 md:py-20 lg:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-sun">
              Stock disponible
            </span>

            <h1
              id="catalogo-titulo"
              className="mt-3 text-balance text-4xl font-black leading-[1.02] tracking-[-0.045em] text-white sm:text-5xl md:text-6xl"
            >
              Encontrá tu próximo vehículo
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/80 md:text-lg">
              Buscá por marca y combiná los filtros de modelo, tipo, año y precio
              para encontrar el vehículo que mejor se adapte a vos.
            </p>

            {/* Buscador principal */}
            <form
              role="search"
              aria-label="Buscar vehículos"
              onSubmit={(event) => event.preventDefault()}
              className="mx-auto mt-8 flex max-w-3xl gap-2"
            >
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">
                  Buscar por marca
                </span>

                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-brand"
                />

                <input
                  type="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  value={filters.q}
                  onChange={(event) =>
                    patch({ q: event.target.value })
                  }
                  placeholder="Buscar por marca..."
                  className={cx(
                    fieldControl,
                    "h-14 rounded-lg border-0 bg-white pl-12 pr-4 text-base text-slate-900 shadow-xl",
                  )}
                />
              </label>

              {/* Botón filtros mobile */}
              <button
                ref={filterTriggerRef}
                id="catalog-filter-trigger"
                type="button"
                aria-haspopup="dialog"
                aria-controls={CATALOG_FILTER_DIALOG_ID}
                aria-expanded={sheetOpen}
                aria-label={
                  sheetCount > 0
                    ? `Abrir filtros del catálogo, ${sheetCount} activos`
                    : "Abrir filtros del catálogo"
                }
                onClick={() => setSheetOpen(true)}
                className="inline-flex h-14 shrink-0 items-center gap-2 rounded-lg bg-sun px-4 font-extrabold text-brand-deep shadow-lg transition hover:bg-[#e5c520] lg:hidden"
              >
                <SlidersHorizontal
                  aria-hidden="true"
                  className="size-5"
                />

                <span>Filtros</span>

                {sheetCount > 0 && (
                  <span
                    aria-hidden="true"
                    className="grid size-6 place-items-center rounded-full bg-brand-deep text-xs font-bold text-white"
                  >
                    {sheetCount}
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Resultado + filtros activos */}
      <div className="border-b border-brand/10 bg-white">
        <div className="mx-auto flex min-h-14 w-full max-w-[1320px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
          <p
            role="status"
            className="m-0 text-sm text-slate-600"
          >
            <strong className="font-black tabular-nums text-brand-deep">
              {count}
            </strong>{" "}
            {count === 1
              ? "vehículo encontrado"
              : "vehículos encontrados"}
          </p>

          {activeChips.length > 0 && (
            <>
              <ul
                aria-label="Filtros activos"
                className="m-0 flex list-none flex-wrap gap-2 p-0"
              >
                {activeChips.map((chip) => (
                  <li key={chip.key}>
                    <button
                      type="button"
                      onClick={chip.clear}
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-brand/15 bg-brand/[0.04] pl-3 pr-2 text-xs font-bold text-brand transition-colors hover:border-brand hover:bg-brand/[0.08]"
                    >
                      {chip.label}

                      <X
                        aria-hidden="true"
                        className="size-3.5"
                      />

                      <span className="sr-only">
                        : quitar filtro
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={reset}
                className="text-xs font-extrabold uppercase tracking-[0.04em] text-brand underline underline-offset-4 transition-colors hover:text-brand-deep"
              >
                Limpiar todo
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filtros mobile */}
      <FilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        state={state}
        returnFocusRef={filterTriggerRef}
      />
    </section>
  );
}