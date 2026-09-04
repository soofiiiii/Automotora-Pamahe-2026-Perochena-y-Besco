import {
  ArrowRight,
  BadgeCheck,
  MessageCircle,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DEFAULT_WHATSAPP } from "../../../config/appConfig";
import { catalogoService } from "../../../services/api";
import type { CatalogoVehiculo } from "../../../types/vehiculo.types";
import VehicleCard from "../components/VehicleCard";

export default function HomePage() {
  const [featured, setFeatured] = useState<CatalogoVehiculo[]>([]);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    catalogoService
      .list()
      .then((rows) => setFeatured(rows.slice(0, 3)))
      .catch(() => setFeatured([]));
  }, []);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = query.trim();
    navigate(q ? `/catalogo?q=${encodeURIComponent(q)}` : "/catalogo");
  };

  return (
    <>
      <section className="hero">
        <div className="container hero__inner">
          <div>
            <span className="eyebrow">Automotora Pamahe · Juan Lacaze</span>
            <h1>Tu próximo vehículo, con información clara y contacto directo.</h1>
            <p>
              Explorá vehículos usados disponibles, revisá sus datos principales y consultanos sin intermediarios.
            </p>
            <form className="hero-search" role="search" onSubmit={submit}>
              <Search aria-hidden="true" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por marca o modelo"
                aria-label="Buscar vehículo por marca o modelo"
                maxLength={80}
              />
              <button className="button button--accent" type="submit">Buscar</button>
            </form>
            <div className="actions-row">
              <Link className="button button--accent" to="/catalogo">
                <Search size={18} />Ver todos
              </Link>
              <a
                className="button hero__ghost"
                href={`https://wa.me/${DEFAULT_WHATSAPP}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={18} />Hablar con Pamahe
              </a>
            </div>
          </div>
          <div className="hero__visual" aria-hidden="true">
            <div className="hero__car">PAMAHE<small>Vehículos usados</small></div>
          </div>
        </div>
      </section>

      <section className="container public-benefits" aria-label="Beneficios">
        <article>
          <BadgeCheck />
          <h2>Atención directa</h2>
          <p>Consultás con la automotora y confirmás personalmente condiciones, documentación y disponibilidad.</p>
        </article>
        <article>
          <ShieldCheck />
          <h2>Información separada</h2>
          <p>El catálogo solo expone la información habilitada para publicación; costos y datos internos permanecen restringidos.</p>
        </article>
        <article>
          <ArrowRight />
          <h2>Stock conectado</h2>
          <p>Las unidades visibles dependen del estado real que administra el sistema interno.</p>
        </article>
      </section>

      {featured.length > 0 && (
        <section className="container featured-section">
          <div className="section-title">
            <div>
              <span className="eyebrow">Disponibles</span>
              <h2>Vehículos destacados</h2>
            </div>
            <Link className="button button--secondary" to="/catalogo">Ver catálogo <ArrowRight size={17} /></Link>
          </div>
          <div className="vehicle-grid">
            {featured.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} />)}
          </div>
        </section>
      )}
    </>
  );
}
