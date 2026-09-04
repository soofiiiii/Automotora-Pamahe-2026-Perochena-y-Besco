import { Search, SlidersHorizontal, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { catalogoService } from "../../../services/api";
import type { CatalogoVehiculo } from "../../../types/vehiculo.types";
import { LoadingState } from "../../../shared/feedback/LoadingState";
import { EmptyState } from "../../../shared/feedback/EmptyState";
import { ErrorState } from "../../../shared/feedback/ErrorState";
import VehicleCard from "../components/VehicleCard";
import { errorMessage } from "../../../utils/errorMessage";

export default function CatalogoPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState<CatalogoVehiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [anioDesde, setAnioDesde] = useState("");
  const [anioHasta, setAnioHasta] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [sort, setSort] = useState("recientes");

  const load = useCallback(
    async (
      filters: {
        marca?: string;
        modelo?: string;
        anioDesde?: string;
        anioHasta?: string;
      } = {},
    ) => {
      setLoading(true);
      setError("");
      try {
        const data = await catalogoService.list({
          marca: filters.marca || undefined,
          modelo: filters.modelo || undefined,
          anioDesde: filters.anioDesde ? Number(filters.anioDesde) : undefined,
          anioHasta: filters.anioHasta ? Number(filters.anioHasta) : undefined,
        });
        setRows(data);
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    catalogoService
      .list({})
      .then((data) => {
        if (!cancelled) {
          setRows(data);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setError(errorMessage(error));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const result = rows.filter((v) => {
      const text =
        `${v.marca} ${v.modelo} ${v.anio} ${v.color ?? ""}`.toLowerCase();
      return (
        (!term || text.includes(term)) &&
        (!min || (v.precioVentaEstimado ?? 0) >= Number(min)) &&
        (!max || (v.precioVentaEstimado ?? Number.MAX_VALUE) <= Number(max))
      );
    });
    return [...result].sort((a, b) => {
      if (sort === "precio-asc")
        return (
          (a.precioVentaEstimado ?? Number.MAX_VALUE) -
          (b.precioVentaEstimado ?? Number.MAX_VALUE)
        );
      if (sort === "precio-desc")
        return (b.precioVentaEstimado ?? -1) - (a.precioVentaEstimado ?? -1);
      if (sort === "anio-desc") return b.anio - a.anio;
      return b.id - a.id;
    });
  }, [rows, q, min, max, sort]);

  const submit = () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    setSearchParams(params, { replace: true });
    void load({ marca, modelo, anioDesde, anioHasta });
  };

  const reset = () => {
    setQ("");
    setMarca("");
    setModelo("");
    setAnioDesde("");
    setAnioHasta("");
    setMin("");
    setMax("");
    setSort("recientes");
    setSearchParams({}, { replace: true });
    void load({ marca: "", modelo: "", anioDesde: "", anioHasta: "" });
  };

  return (
    <div className="container catalog-page">
      <header className="catalog-heading">
        <span className="eyebrow">Stock disponible</span>
        <h1>Encontrá tu vehículo</h1>
        <p>
          Todos los vehículos publicados en este catálogo son usados. Consultá
          cada ficha para confirmar disponibilidad y condiciones.
        </p>
      </header>

      <form
        className="catalog-filters"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="catalog-filters__title">
          <SlidersHorizontal />
          <strong>Filtros</strong>
        </div>
        <label>
          <span>Búsqueda</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Marca o modelo"
            maxLength={80}
          />
        </label>
        <label>
          <span>Marca</span>
          <input
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
            placeholder="Ej. Toyota"
            maxLength={80}
          />
        </label>
        <label>
          <span>Modelo</span>
          <input
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            placeholder="Ej. Corolla"
            maxLength={80}
          />
        </label>
        <label>
          <span>Año desde</span>
          <input
            type="number"
            min="1950"
            max="2100"
            value={anioDesde}
            onChange={(e) => setAnioDesde(e.target.value)}
          />
        </label>
        <label>
          <span>Año hasta</span>
          <input
            type="number"
            min="1950"
            max="2100"
            value={anioHasta}
            onChange={(e) => setAnioHasta(e.target.value)}
          />
        </label>
        <label>
          <span>Precio mín.</span>
          <input
            type="number"
            min="0"
            value={min}
            onChange={(e) => setMin(e.target.value)}
          />
        </label>
        <label>
          <span>Precio máx.</span>
          <input
            type="number"
            min="0"
            value={max}
            onChange={(e) => setMax(e.target.value)}
          />
        </label>
        <button className="button button--accent" type="submit">
          <Search size={18} />
          Buscar
        </button>
        <button className="button button--ghost" type="button" onClick={reset}>
          <X size={18} />
          Limpiar
        </button>
      </form>

      <div className="catalog-result-head">
        <div>
          <strong>{filtered.length} vehículo(s)</strong>
          <span> disponibles para consulta</span>
        </div>
        <label className="catalog-sort">
          <span className="sr-only">Ordenar</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="recientes">Más recientes</option>
            <option value="anio-desc">Año: mayor a menor</option>
            <option value="precio-asc">Precio: menor a mayor</option>
            <option value="precio-desc">Precio: mayor a menor</option>
          </select>
        </label>
      </div>

      {error ? (
        <ErrorState
          description={error}
          onRetry={() => void load({ marca, modelo, anioDesde, anioHasta })}
        />
      ) : loading ? (
        <LoadingState label="Buscando vehículos…" />
      ) : filtered.length ? (
        <div className="vehicle-grid">
          {filtered.map((v) => (
            <VehicleCard key={v.id} vehicle={v} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No encontramos vehículos con esos filtros"
          description="Probá ampliar el rango de búsqueda."
        />
      )}
    </div>
  );
}
