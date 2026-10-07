import { useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { RotateCcw } from "lucide-react";
import { PAGE_SIZE } from "../../../config/appConfig";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { useVehicleTypeOptions } from "../../../hooks/useVehicleTypeOptions";
import { catalogoService } from "../../../services/api";
import { ErrorState } from "../../../shared/feedback/ErrorState";
import { PaginationControls } from "../../../shared/navigation/PaginationControls";
import { SeoMeta } from "../../../shared/seo/SeoMeta";
import { parseVehicleFilters } from "../../../utils/vehicleFilters";
import { CatalogHeader } from "../components/CatalogHeader";
import { FilterFields } from "../components/FilterFields";
import { VehicleGrid } from "../components/VehicleGrid";
import { cx, fieldControl } from "../components/catalogStyles";
import {
  SORT_OPTIONS,
  useCatalogFilters,
  type SortKey,
} from "../hooks/useCatalogFilters";

const SERVER_SORT_OPTIONS = {
  recientes: "id,desc",
  "anio-desc": "anio,desc",
  "precio-asc": "precioVentaEstimado,asc",
  "precio-desc": "precioVentaEstimado,desc",
} as const;

type SortOption = keyof typeof SERVER_SORT_OPTIONS;

const readPage = (value: string | null) => {
  const parsed = Number(value ?? "1");
  return Number.isInteger(parsed) && parsed > 0 ? parsed - 1 : 0;
};

const readSort = (value: string | null): SortOption =>
  value && value in SERVER_SORT_OPTIONS ? (value as SortOption) : "recientes";

export default function CatalogoPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { options: vehicleTypes } = useVehicleTypeOptions();
  const query = searchParams.toString();
  const page = readPage(searchParams.get("page"));
  const sort = readSort(searchParams.get("sort"));

  const load = useCallback(
    async (signal: AbortSignal) => {
      const current = new URLSearchParams(query);
      const filters = parseVehicleFilters(current, false, true);

      return catalogoService.page(
        {
          ...filters,
          page,
          size: PAGE_SIZE,
          sort: SERVER_SORT_OPTIONS[sort],
        },
        signal,
      );
    },
    [page, query, sort],
  );

  const { data, loading, error, retry } = useApiQuery(load);
  const rows = data?.content ?? [];

  const updateSearchParams = useCallback(
    (next: URLSearchParams) => setSearchParams(next, { replace: true }),
    [setSearchParams],
  );

  const resultCount = data?.totalElements ?? rows.length;
  const catalog = useCatalogFilters(
    searchParams,
    updateSearchParams,
    resultCount,
    vehicleTypes,
  );

  const setPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);

    if (nextPage <= 0) next.delete("page");
    else next.set("page", String(nextPage + 1));

    setSearchParams(next, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section className="min-h-screen bg-paper pb-16">
      <SeoMeta
        title="Vehículos usados disponibles | Automotora Pamahe"
        description="Consultá el catálogo de vehículos usados disponibles de Automotora Pamahe en Juan Lacaze, con filtros por marca, modelo, tipo, año y precio."
        canonicalPath="/catalogo"
      />

      <CatalogHeader state={catalog} />

      <div className="mx-auto grid w-full max-w-[1320px] gap-7 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:pt-10">
        <aside className="hidden self-start border border-brand/10 bg-white p-5 shadow-sm lg:sticky lg:top-[92px] lg:block">
          <div className="flex items-center justify-between gap-3 border-b border-brand/10 pb-4">
            <h2 className="m-0 text-lg font-black tracking-[-0.02em] text-brand-deep">Filtrar vehículos</h2>
            <button
              type="button"
              onClick={catalog.reset}
              className="inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-[0.04em] text-brand hover:text-brand-deep"
            >
              <RotateCcw aria-hidden="true" className="size-3.5" /> Limpiar
            </button>
          </div>

          <fieldset className="mt-5 border-0 p-0">
            <legend className="mb-3 text-[12px] font-extrabold uppercase tracking-[0.08em] text-brand-deep/65">
              Tipo de vehículo
            </legend>
            <div className="grid gap-1">
              <label className="flex cursor-pointer items-center gap-2 py-1.5 text-sm font-semibold text-brand-deep/80">
                <input
                  type="radio"
                  name="tipo-desktop"
                  checked={catalog.filters.tipo === ""}
                  onChange={() => catalog.patch({ tipo: "" })}
                  className="accent-brand"
                />
                Todos
              </label>
              {catalog.vehicleTypes.map((type) => (
                <label key={type.value} className="flex cursor-pointer items-center gap-2 py-1.5 text-sm font-semibold text-brand-deep/80">
                  <input
                    type="radio"
                    name="tipo-desktop"
                    checked={catalog.filters.tipo === type.value}
                    onChange={() => catalog.patch({ tipo: type.value })}
                    className="accent-brand"
                  />
                  {type.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-5 border-t border-brand/10 pt-5">
            <FilterFields state={catalog} layout="stack" />
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-brand/10 pb-4">
            <div>
              <strong className="block text-lg font-black text-brand-deep">
                {resultCount} {resultCount === 1 ? "vehículo" : "vehículos"}
              </strong>
              <span className="text-sm text-slate-600">Disponibles para consulta</span>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-600">
              <span className="hidden sm:inline">Ordenar</span>
              <select
                aria-label="Ordenar"
                value={catalog.filters.sort}
                onChange={(event) => catalog.patch({ sort: event.target.value as SortKey })}
                className={cx(fieldControl, "h-10 w-auto min-w-48 py-0 text-sm font-bold")}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>

          {error ? (
            <ErrorState description={error} onRetry={retry} />
          ) : (
            <>
              <VehicleGrid
                vehicles={rows}
                loading={loading}
                onReset={catalog.reset}
              />

              {!loading && rows.length > 0 && (
                <div className="mt-8">
                  <PaginationControls
                    page={data?.number ?? 0}
                    totalPages={data?.totalPages ?? 0}
                    totalElements={data?.totalElements ?? 0}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1320px] px-4 sm:px-6">
        <div className="flex flex-col gap-4 rounded-2xl bg-brand-deep p-6 text-white sm:flex-row sm:items-center sm:justify-between md:p-8">
          <div>
            <strong className="text-xl font-black">¿Querés ofrecernos tu vehículo?</strong>
            <p className="mb-0 mt-1 text-sm text-white/70">Completá el formulario público con los datos básicos y fotografías para que podamos revisarlo.</p>
          </div>
          <Link to="/quiero-vender-mi-vehiculo" className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-sun px-5 font-extrabold text-brand-deep">
            Quiero vender mi vehículo
          </Link>
        </div>
      </div>
    </section>
  );
}
