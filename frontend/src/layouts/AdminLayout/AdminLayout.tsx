import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Car,
  ChevronRight,
  ClipboardList,
  Contact,
  FileClock,
  FileText,
  Gauge,
  Inbox,
  LogOut,
  LockKeyhole,
  Menu,
  Receipt,
  Settings,
  ShoppingCart,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppLogo } from "../../shared/components/AppLogo";
import { OfflineBanner } from "../../shared/components/OfflineBanner";
import { NotificationBell } from "../../shared/components/NotificationBell";
import { PwaInstallButton } from "../../shared/components/PwaInstallButton";
import {
  COMMERCIAL_ROLES,
  MANAGEMENT_ROLES,
  REVIEW_NOTIFICATION_ROLES,
  WORKSHOP_ROLES,
  hasAnyRole,
} from "../../config/permissions";
import { useAuth } from "../../hooks/useAuth";

interface NavigationItem {
  to: string;
  label: string;
  icon: ReactNode;
}

function NavItem({ to, label, icon }: NavigationItem) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "group relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-[0.88rem] font-semibold transition-all duration-200",
          isActive
            ? "bg-white text-brand-deep shadow-[0_8px_24px_rgba(0,0,0,0.16)]"
            : "text-white/65 hover:bg-white/8 hover:text-white",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={[
              "grid size-8 shrink-0 place-items-center rounded-lg transition-colors [&>svg]:size-[18px]",
              isActive
                ? "bg-brand/10 text-brand"
                : "bg-white/5 text-white/60 group-hover:bg-white/10 group-hover:text-sun",
            ].join(" ")}
          >
            {icon}
          </span>
          <span className="min-w-0 flex-1 truncate">{label}</span>
          <ChevronRight
            aria-hidden="true"
            className={[
              "size-4 shrink-0 transition-all",
              isActive
                ? "translate-x-0 text-brand/55 opacity-100"
                : "-translate-x-1 text-white/35 opacity-0 group-hover:translate-x-0 group-hover:opacity-100",
            ].join(" ")}
          />
        </>
      )}
    </NavLink>
  );
}

function NavGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <span className="px-3 pb-1 pt-3 text-[0.64rem] font-extrabold uppercase tracking-[0.16em] text-white/35">
        {title}
      </span>
      {children}
    </div>
  );
}

function initials(value?: string | null) {
  if (!value) return "PA";
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function AdminLayout() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const roles = useMemo(() => session?.roles ?? [], [session?.roles]);
  const management = hasAnyRole(roles, MANAGEMENT_ROLES);
  const commercial = hasAnyRole(roles, COMMERCIAL_ROLES);
  const workshop = hasAnyRole(roles, WORKSHOP_ROLES);
  const reviewNotifications = hasAnyRole(roles, REVIEW_NOTIFICATION_ROLES);

  const roleLabel = useMemo(
    () =>
      roles
        .map((role) => role.replaceAll("_", " ").toLowerCase())
        .map((role) => role.charAt(0).toUpperCase() + role.slice(1))
        .join(" · "),
    [roles],
  );

  useEffect(() => {
    if (!open) return;

    window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    document.body.classList.add("overflow-hidden");

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      window.requestAnimationFrame(() => menuButtonRef.current?.focus());
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.classList.remove("overflow-hidden");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className="admin-shell min-h-dvh bg-[#f3f5f9] lg:grid lg:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[19rem_minmax(0,1fr)]">
      <a className="skip-link" href="#contenido-principal-interno">
        Saltar al contenido
      </a>

      <aside
        id="admin-navigation"
        className={[
          "fixed inset-y-0 left-0 z-[100] flex w-[min(19rem,88vw)] flex-col overflow-hidden bg-[linear-gradient(180deg,#16275f_0%,#101936_58%,#0d1328_100%)] text-white shadow-2xl transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:h-dvh lg:w-full lg:translate-x-0 lg:shadow-none",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex min-h-[76px] items-center gap-3 border-b border-white/10 px-4">
          <div className="min-w-0 flex-1 [&_.app-logo]:text-white [&_.app-logo__mark]:shadow-[0_7px_22px_rgba(242,210,46,0.22)] [&_.app-logo_small]:text-white/45">
            <AppLogo variant="inverse" />
          </div>
          <button
            ref={closeButtonRef}
            className="grid size-10 shrink-0 place-items-center rounded-xl text-white/70 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
          >
            <X className="size-5" />
          </button>
        </div>

        <nav
          aria-label="Módulos del sistema"
          onClick={() => setOpen(false)}
          className="scrollbar-none min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3"
        >
          <NavGroup title="Principal">
            <NavItem to="/app" label="Inicio" icon={<Gauge />} />
            {management && (
              <NavItem to="/app/dashboard" label="Dashboard" icon={<BarChart3 />} />
            )}
            <NavItem
              to="/app/mi-cuenta/password"
              label="Mi contraseña"
              icon={<LockKeyhole />}
            />
          </NavGroup>

          <NavGroup title="Operación">
            <NavItem to="/app/vehiculos" label="Vehículos" icon={<Car />} />
            {commercial && (
              <NavItem to="/app/clientes" label="Clientes" icon={<Contact />} />
            )}
            {management ? (
              <NavItem to="/app/compras" label="Compras" icon={<ShoppingCart />} />
            ) : commercial ? (
              <NavItem
                to="/app/compras/nueva"
                label="Registrar compra"
                icon={<ShoppingCart />}
              />
            ) : null}
            {commercial && (
              <NavItem to="/app/ventas" label="Ventas" icon={<Receipt />} />
            )}
            {commercial && (
              <NavItem to="/app/solicitudes-venta" label="Solicitudes" icon={<Inbox />} />
            )}
            {workshop && <NavItem to="/app/taller" label="Taller" icon={<Wrench />} />}
          </NavGroup>

          {management && (
            <NavGroup title="Gestión">
              <NavItem to="/app/costos" label="Costos" icon={<ClipboardList />} />
              <NavItem to="/app/reportes" label="Reportes" icon={<FileText />} />
              <NavItem to="/app/auditoria" label="Auditoría" icon={<FileClock />} />
              <NavItem to="/app/usuarios" label="Usuarios" icon={<Users />} />
              <NavItem to="/app/parametros" label="Parámetros" icon={<Settings />} />
            </NavGroup>
          )}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-2xl bg-white/[0.06] p-2.5 ring-1 ring-inset ring-white/5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sun text-xs font-black tracking-wide text-brand-deep shadow-[0_6px_18px_rgba(242,210,46,0.16)]">
              {initials(session?.nombre || session?.username)}
            </span>
            <div className="min-w-0 flex-1">
              <strong className="block truncate text-sm font-bold text-white">
                {session?.nombre || session?.username}
              </strong>
              <small className="block truncate pt-0.5 text-[0.68rem] font-medium text-white/45">
                {roleLabel || session?.username}
              </small>
            </div>
            <button
              className="grid size-9 shrink-0 place-items-center rounded-xl text-white/55 transition-colors hover:bg-white/10 hover:text-sun"
              type="button"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              <LogOut className="size-[18px]" />
            </button>
          </div>
        </div>
      </aside>

      <div className="admin-main min-w-0">
        <OfflineBanner />
        <header className="admin-topbar sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 shadow-[0_1px_0_rgba(15,23,42,0.02)] backdrop-blur-xl sm:px-6 lg:px-8">
          <button
            ref={menuButtonRef}
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-brand-deep shadow-sm transition-colors hover:border-brand/20 hover:bg-brand/[0.04] lg:hidden"
            type="button"
            aria-label="Abrir menú"
            aria-expanded={open}
            aria-controls="admin-navigation"
            onClick={() => setOpen(true)}
          >
            <Menu className="size-5" />
          </button>

          <div className="min-w-0">
            <span className="block truncate text-sm font-extrabold tracking-[-0.01em] text-slate-900 sm:text-[0.95rem]">
              Sistema de gestión
            </span>
            <small className="hidden text-xs font-medium text-slate-500 sm:block">
              Automotora Pamahe · Operación interna
            </small>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <PwaInstallButton />
            {reviewNotifications && <NotificationBell />}
          </div>

          <div className="hidden items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-1.5 sm:flex">
            <span className="grid size-7 place-items-center rounded-lg bg-brand text-[0.66rem] font-black text-white">
              {initials(session?.nombre || session?.username)}
            </span>
            <div className="min-w-0 leading-tight">
              <strong className="block max-w-40 truncate text-xs text-slate-800">
                {session?.nombre || session?.username}
              </strong>
              <small className="block max-w-40 truncate text-[0.64rem] text-slate-500">
                {roleLabel}
              </small>
            </div>
          </div>
        </header>

        <main
          id="contenido-principal-interno"
          tabIndex={-1}
          className="admin-content mx-auto w-full max-w-[1540px] px-3 py-5 outline-none sm:px-5 sm:py-6 lg:px-8 lg:py-8 xl:px-10"
        >
          <Outlet />
        </main>
      </div>

      {open && (
        <button
          type="button"
          className="fixed inset-0 z-[90] border-0 bg-slate-950/55 backdrop-blur-[2px] lg:hidden"
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}
