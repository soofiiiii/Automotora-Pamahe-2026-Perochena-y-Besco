import {
  ArrowRight,
  BadgeCheck,
  Car,
  CarFront,
  MessageCircle,
  Package,
  Search,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DEFAULT_WHATSAPP } from "../../../config/appConfig";
import { catalogoService } from "../../../services/api";
import { useVehicleTypeOptions } from "../../../hooks/useVehicleTypeOptions";
import { SeoMeta } from "../../../shared/seo/SeoMeta";
import type { CatalogoVehiculo } from "../../../types/vehiculo.types";
import VehicleCard from "../components/VehicleCard";

const VEHICLE_TYPE_ICONS = {
  AUTO: CarFront,
  SUV: Car,
  CAMIONETA: Truck,
  UTILITARIO: Package,
} as const;

export default function HomePage() {
  const [featured, setFeatured] = useState<CatalogoVehiculo[]>([]);
  const { options: vehicleTypes } = useVehicleTypeOptions();
  const [query, setQuery] = useState("");
  const [searchField, setSearchField] = useState<"marca" | "modelo">("marca");
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();

    catalogoService
      .page({ page: 0, size: 4, sort: "id,desc" }, controller.signal)
      .then((result) => setFeatured(result.content.slice(0, 4)))
      .catch(() => {
        if (!controller.signal.aborted) setFeatured([]);
      });

    return () => controller.abort();
  }, []);

  const heroImage = "/images/home/hero-home.webp";

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = query.trim();
    const params = new URLSearchParams();
    if (value) params.set(searchField, value);
    navigate(value ? `/catalogo?${params.toString()}` : "/catalogo");
  };

  const whatsapp = DEFAULT_WHATSAPP.replace(/\D/g, "");

  return (
    <>
      <SeoMeta
        title="Automotora Pamahe | Vehículos usados en Juan Lacaze"
        description="Consultá vehículos usados disponibles en Automotora Pamahe, revisá sus características y contactanos directamente desde el catálogo."
        canonicalPath="/"
      />

      <section className="relative isolate min-h-[570px] overflow-hidden bg-brand-deep text-white md:min-h-[620px]">
        {heroImage && (
          <img
            src={heroImage}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
            fetchPriority="high"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(25,41,89,0.96)_0%,rgba(25,41,89,0.88)_45%,rgba(25,41,89,0.54)_100%)]" />
        <div className="mx-auto flex min-h-[570px] w-full max-w-[1320px] items-center px-4 py-16 sm:px-6 md:min-h-[620px] md:py-20">
          <div className="w-full max-w-4xl">
            <span className="inline-flex border-l-4 border-sun pl-3 text-xs font-extrabold uppercase tracking-[0.18em] text-white/75">
              Automotora Pamahe · Juan Lacaze
            </span>
            <h1 className="mt-5 max-w-4xl text-balance text-[clamp(2.65rem,6vw,5.6rem)] font-black leading-[0.96] tracking-[-0.045em] text-white">
              A un clic del vehículo que buscás.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-7 text-white/78 md:text-xl">
              Explorá nuestro stock de usados, compará sus datos principales y consultanos directamente.
            </p>

            <form
              className="mt-8 grid max-w-3xl grid-cols-[150px_minmax(0,1fr)_56px] overflow-hidden bg-white shadow-2xl max-sm:grid-cols-[1fr_52px]"
              role="search"
              onSubmit={submit}
            >
              <label className="sr-only" htmlFor="home-search-field">
                Criterio de búsqueda
              </label>
              <select
                id="home-search-field"
                aria-label="Buscar por"
                value={searchField}
                onChange={(event) =>
                  setSearchField(event.target.value === "modelo" ? "modelo" : "marca")
                }
                className="h-14 border-0 border-r border-brand/10 bg-white px-4 text-sm font-bold text-brand-deep outline-none max-sm:hidden"
              >
                <option value="marca">Marca</option>
                <option value="modelo">Modelo</option>
              </select>
              <label className="sr-only" htmlFor="home-search-value">
                Término de búsqueda
              </label>
              <input
                id="home-search-value"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchField === "marca" ? "Buscá por marca..." : "Buscá por modelo..."}
                aria-label={`Buscar vehículo por ${searchField}`}
                maxLength={80}
                className="h-14 min-w-0 border-0 bg-white px-5 text-base text-[#17191d] outline-none placeholder:text-slate-500"
              />
              <button
                className="grid h-14 place-items-center bg-sun text-brand-deep transition-colors hover:bg-[#e5c520]"
                type="submit"
                aria-label="Buscar vehículos"
              >
                <ArrowRight aria-hidden="true" className="size-6" />
              </button>
            </form>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-sun px-5 font-extrabold text-brand-deep transition-colors hover:bg-[#e5c520]"
                to="/catalogo"
              >
                Ver todos los vehículos <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <a
                className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-5 font-bold text-white backdrop-blur-sm hover:bg-white/15"
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={18} aria-hidden="true" />
                Hablar con Pamahe
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-10 grid w-[min(1180px,calc(100%-32px))] gap-px overflow-hidden border border-brand/10 bg-brand/10 shadow-lift md:grid-cols-3">
        <article className="bg-white px-6 py-5 md:px-7">
          <BadgeCheck aria-hidden="true" className="size-7 text-brand" />
          <h2 className="mb-1 mt-3 text-base font-extrabold uppercase tracking-[0.04em] text-brand-deep">Atención directa</h2>
          <p className="m-0 text-sm leading-6 text-slate-600">Consultá condiciones y disponibilidad directamente con la automotora.</p>
        </article>
        <article className="bg-white px-6 py-5 md:px-7">
          <ShieldCheck aria-hidden="true" className="size-7 text-brand" />
          <h2 className="mb-1 mt-3 text-base font-extrabold uppercase tracking-[0.04em] text-brand-deep">Información clara</h2>
          <p className="m-0 text-sm leading-6 text-slate-600">Cada publicación muestra únicamente los datos comerciales habilitados.</p>
        </article>
        <article className="bg-white px-6 py-5 md:px-7">
          <Search aria-hidden="true" className="size-7 text-brand" />
          <h2 className="mb-1 mt-3 text-base font-extrabold uppercase tracking-[0.04em] text-brand-deep">Stock actualizado</h2>
          <p className="m-0 text-sm leading-6 text-slate-600">El catálogo acompaña el estado real administrado por el sistema interno.</p>
        </article>
      </section>

      <section className="mx-auto w-full max-w-[1320px] px-4 py-20 sm:px-6" aria-labelledby="vehicle-types-title">
        <div className="text-center">
          <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand">Elegí por categoría</span>
          <h2 id="vehicle-types-title" className="mt-2 text-3xl font-black tracking-[-0.035em] text-[#17191d] md:text-4xl">
            Encontrá tu vehículo
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">Accedé directamente al tipo de unidad que estás buscando.</p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-px border border-brand/10 bg-brand/10 md:grid-cols-4">
          {vehicleTypes.map(({ value, label }) => {
            const Icon = VEHICLE_TYPE_ICONS[value as keyof typeof VEHICLE_TYPE_ICONS] ?? Car;
            return (
            <Link
              key={value}
              to={`/catalogo?tipoVehiculo=${encodeURIComponent(value)}`}
              className="group flex min-h-44 flex-col items-center justify-center bg-white px-5 py-8 text-center transition-colors hover:bg-brand/[0.035]"
            >
              <Icon aria-hidden="true" className="size-12 stroke-[1.5] text-brand transition-transform duration-200 group-hover:-translate-y-1" />
              <strong className="mt-5 text-sm font-black uppercase tracking-[0.08em] text-brand-deep">{label}</strong>
              <span className="mt-2 h-[3px] w-8 bg-sun transition-all duration-200 group-hover:w-14" />
            </Link>
            );
          })}
        </div>
      </section>

      <section className="bg-white py-16 md:py-20" aria-labelledby="featured-title">
        <div className="mx-auto w-full max-w-[1320px] px-4 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand">Stock disponible</span>
              <h2 id="featured-title" className="mb-0 mt-2 text-3xl font-black tracking-[-0.035em] text-[#17191d] md:text-4xl">
                Vehículos destacados
              </h2>
            </div>
            <Link className="inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.05em] text-brand hover:text-brand-deep" to="/catalogo">
              Ver catálogo <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>

          {featured.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {featured.map((vehicle, index) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} index={index} priority={index < 2} />
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-brand/20 bg-paper px-6 py-12 text-center text-slate-600">
              Consultá el catálogo para ver los vehículos disponibles.
            </div>
          )}
        </div>
      </section>

      <section className="bg-brand-deep py-14 text-white md:py-16">
        <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-7 px-4 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-sun">¿Querés vender tu vehículo?</span>
            <h2 className="mb-0 mt-2 max-w-2xl text-3xl font-black tracking-[-0.035em] text-white md:text-4xl">
              Contanos qué auto tenés y coordinamos el contacto.
            </h2>
          </div>
          <Link
            to="/quiero-vender-mi-vehiculo"
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-sun px-6 font-extrabold text-brand-deep hover:bg-[#e5c520]"
          >
            Enviar datos del vehículo <ArrowRight aria-hidden="true" className="size-5" />
          </Link>
        </div>
      </section>
    </>
  );
}
