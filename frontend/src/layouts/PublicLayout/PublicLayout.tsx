import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import {
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  WifiOff,
  X,
} from "lucide-react";
import { AppLogo } from "../../shared/components/AppLogo";
import {
  BUSINESS_HOURS_SATURDAY,
  BUSINESS_HOURS_WEEK,
  BUSINESS_LOCATION,
  DEFAULT_PHONE,
  DEFAULT_PHONE_DISPLAY,
  DEFAULT_WHATSAPP,
} from "../../config/appConfig";

function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return online;
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "relative inline-flex h-16 items-center text-[13px] font-extrabold uppercase tracking-[0.06em] transition-colors",
    isActive
      ? "text-brand after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:bg-sun"
      : "text-brand-deep/75 hover:text-brand",
  ].join(" ");

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const online = useOnline();
  const close = () => setMenuOpen(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      window.requestAnimationFrame(() => menuButtonRef.current?.focus());
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const whatsapp = DEFAULT_WHATSAPP.replace(/\D/g, "");

  return (
    <div className="flex min-h-dvh flex-col bg-paper text-[#17191d]">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:bg-white focus:px-4 focus:py-2.5 focus:font-semibold focus:shadow-lift"
        href="#contenido-principal"
      >
        Saltar al contenido
      </a>

      {!online && (
        <div
          role="status"
          className="flex items-center justify-center gap-2 bg-sun px-4 py-2 text-center text-sm font-semibold text-brand-deep"
        >
          <WifiOff aria-hidden="true" className="size-4 shrink-0" />
          Sin conexión. Algunas funciones pueden no estar disponibles.
        </div>
      )}

      <div data-surface="dark" className="hidden bg-brand-deep text-[12px] text-white md:block">
        <div className="mx-auto flex h-9 w-full max-w-[1320px] items-center justify-between px-6">
          <span className="inline-flex items-center gap-2 text-white/70">
            <MapPin aria-hidden="true" className="size-3.5 text-sun" />
            {BUSINESS_LOCATION}
          </span>
          <div className="flex items-center gap-6">
            <a href={`tel:${DEFAULT_PHONE}`} className="inline-flex items-center gap-2 hover:text-sun">
              <Phone aria-hidden="true" className="size-3.5" />
              {DEFAULT_PHONE_DISPLAY}
            </a>
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 hover:text-sun"
            >
              <MessageCircle aria-hidden="true" className="size-3.5" /> WhatsApp
            </a>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-brand-deep/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1320px] items-center gap-8 px-4 sm:px-6 md:h-[68px]">
          <Link
            to="/"
            onClick={close}
            aria-label="Automotora Pamahe - inicio"
            className="mr-auto shrink-0 text-brand-deep"
          >
            <AppLogo />
          </Link>

          <nav className="hidden items-stretch gap-7 md:flex" aria-label="Navegación principal">
            <NavLink to="/" className={navLinkClass}>
              Inicio
            </NavLink>
            <NavLink to="/catalogo" className={navLinkClass}>
              Vehículos
            </NavLink>
            <NavLink to="/quiero-vender-mi-vehiculo" className={navLinkClass}>
              Vendé tu vehículo
            </NavLink>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <a
              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Hola Pamahe, quisiera hacer una consulta.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-sun px-4 text-sm font-extrabold text-brand-deep transition-colors hover:bg-[#e7c721]"
            >
              <MessageCircle aria-hidden="true" className="size-4" /> Contacto
            </a>
          </div>

          <button
            ref={menuButtonRef}
            type="button"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            aria-controls="public-navigation"
            onClick={() => setMenuOpen((value) => !value)}
            className="inline-grid size-11 place-items-center rounded-lg text-brand-deep transition-colors hover:bg-brand/[0.06] md:hidden"
          >
            {menuOpen ? (
              <X aria-hidden="true" className="size-6" />
            ) : (
              <Menu aria-hidden="true" className="size-6" />
            )}
          </button>
        </div>

        {menuOpen && (
          <nav
            id="public-navigation"
            className="absolute inset-x-0 top-full animate-pop border-t border-brand/10 bg-white px-4 pb-5 pt-2 shadow-lift md:hidden"
            aria-label="Navegación principal"
          >
            <NavLink to="/" onClick={close} className="flex h-12 items-center font-bold text-brand-deep">
              Inicio
            </NavLink>
            <NavLink to="/catalogo" onClick={close} className="flex h-12 items-center font-bold text-brand-deep">
              Vehículos
            </NavLink>
            <NavLink to="/quiero-vender-mi-vehiculo" onClick={close} className="flex h-12 items-center font-bold text-brand-deep">
              Vendé tu vehículo
            </NavLink>
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex h-12 items-center justify-center gap-2 rounded-lg bg-sun font-extrabold text-brand-deep"
            >
              <MessageCircle aria-hidden="true" className="size-5" /> Contacto
            </a>
          </nav>
        )}
      </header>

      <main id="contenido-principal" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>

      <footer data-surface="dark" className="mt-10 bg-brand-deep pb-[calc(5rem+env(safe-area-inset-bottom))] pt-12 text-white md:pb-10">
        <div className="mx-auto grid w-full max-w-[1320px] gap-9 px-4 sm:px-6 md:grid-cols-[1.35fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <AppLogo variant="inverse" />
            <p className="mt-4 text-sm leading-6 text-white/65">
              Compra, reacondicionamiento y comercialización de vehículos usados en {BUSINESS_LOCATION}.
            </p>
          </div>
          <div>
            <strong className="text-sm uppercase tracking-[0.08em]">Navegación</strong>
            <div className="mt-3 grid gap-2 text-sm text-white/70">
              <Link to="/" className="hover:text-sun">Inicio</Link>
              <Link to="/catalogo" className="hover:text-sun">Vehículos</Link>
              <Link to="/quiero-vender-mi-vehiculo" className="hover:text-sun">Vendé tu vehículo</Link>
            </div>
          </div>
          <div>
            <strong className="text-sm uppercase tracking-[0.08em]">Contacto</strong>
            <div className="mt-3 grid gap-2 text-sm text-white/70">
              <a href={`tel:${DEFAULT_PHONE}`} className="inline-flex items-center gap-2 hover:text-sun">
                <Phone aria-hidden="true" className="size-4" /> {DEFAULT_PHONE_DISPLAY}
              </a>
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-sun"
              >
                <MessageCircle aria-hidden="true" className="size-4" /> WhatsApp
              </a>
            </div>
          </div>
          <div>
            <strong className="text-sm uppercase tracking-[0.08em]">Horarios</strong>
            <div className="mt-3 grid gap-2 text-sm leading-6 text-white/65">
              <span>{BUSINESS_HOURS_WEEK}</span>
              <span>{BUSINESS_HOURS_SATURDAY}</span>
              <Link to="/privacidad" className="mt-2 hover:text-sun">Privacidad</Link>
              <Link to="/informacion-legal" className="hover:text-sun">Información al consumidor</Link>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-10 w-full max-w-[1320px] border-t border-white/10 px-4 pt-5 text-xs text-white/65 sm:px-6">
          Automotora Pamahe · {BUSINESS_LOCATION}
        </div>
      </footer>

      <nav
        aria-label="Contacto rápido"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-brand/10 bg-white/95 px-3 pt-2 backdrop-blur-xl md:hidden"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto grid max-w-md grid-cols-[1fr_auto] gap-2">
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-sun px-4 font-extrabold text-brand-deep"
          >
            <MessageCircle aria-hidden="true" className="size-5" /> WhatsApp
          </a>
          <a
            href={`tel:${DEFAULT_PHONE}`}
            aria-label="Llamar"
            className="inline-grid size-12 place-items-center rounded-lg border border-brand/20 bg-white text-brand"
          >
            <Phone aria-hidden="true" className="size-5" />
          </a>
        </div>
      </nav>
    </div>
  );
}
