import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { LogIn, Menu, MessageCircle, Phone, X } from "lucide-react";
import { AppLogo } from "../../shared/components/AppLogo";
import {
  BUSINESS_HOURS_SATURDAY,
  BUSINESS_HOURS_WEEK,
  BUSINESS_LOCATION,
  DEFAULT_PHONE,
  DEFAULT_PHONE_DISPLAY,
  DEFAULT_WHATSAPP,
} from "../../config/appConfig";

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  return (
    <div className="public-shell">
      <a className="skip-link" href="#contenido-principal">Saltar al contenido</a>
      <header className="public-header">
        <div className="container public-header__inner">
          <Link to="/" onClick={close} aria-label="Automotora Pamahe - inicio"><AppLogo /></Link>
          <button
            className="icon-button public-menu-button"
            type="button"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
          <nav className={menuOpen ? "public-nav public-nav--open" : "public-nav"} aria-label="Navegación principal">
            <NavLink to="/" onClick={close}>Inicio</NavLink>
            <NavLink to="/catalogo" onClick={close}>Vehículos</NavLink>
            <a href={`https://wa.me/${DEFAULT_WHATSAPP}`} target="_blank" rel="noopener noreferrer" onClick={close}>
              <MessageCircle size={17} />WhatsApp
            </a>
            <Link className="button button--ghost" to="/login" onClick={close}>
              <LogIn size={17} />Acceso interno
            </Link>
          </nav>
        </div>
      </header>
      <main id="contenido-principal"><Outlet /></main>
      <footer className="public-footer">
        <div className="container public-footer__grid">
          <div>
            <AppLogo />
            <p>Compra, reacondicionamiento y comercialización de vehículos usados en {BUSINESS_LOCATION}.</p>
          </div>
          <div>
            <strong>Contacto</strong>
            <a href={`tel:${DEFAULT_PHONE}`}><Phone size={16} />{DEFAULT_PHONE_DISPLAY}</a>
            <a href={`https://wa.me/${DEFAULT_WHATSAPP}`} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={16} />Consultar por WhatsApp
            </a>
          </div>
          <div>
            <strong>Horarios</strong>
            <span>{BUSINESS_HOURS_WEEK}</span>
            <span>{BUSINESS_HOURS_SATURDAY}</span>
          </div>
          <div>
            <strong>Información</strong>
            <Link to="/privacidad">Privacidad</Link>
            <Link to="/informacion-legal">Información al consumidor</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
