import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
    BarChart3,
    Car,
    ClipboardList,
    Contact,
    FileClock,
    FileText,
    Gauge,
    LogOut,
    Menu,
    Receipt,
    Settings,
    ShoppingCart,
    Users,
    Wrench,
    X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { AppLogo } from "../../shared/components/AppLogo";
import { OfflineBanner } from "../../shared/components/OfflineBanner";
import {
    COMMERCIAL_ROLES,
    MANAGEMENT_ROLES,
    WORKSHOP_ROLES,
    hasAnyRole,
} from "../../config/permissions";
import { useAuth } from "../../hooks/useAuth";


function NavItem({
    to,
    label,
    icon,
}: {
    to: string;
    label: string;
    icon: ReactNode;
}) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                `side-link ${isActive ? "side-link--active" : ""}`
            }
        >
            {icon}
            <span>{label}</span>
        </NavLink>
    );
}


export default function AdminLayout() {
    const { session, logout } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const roles = session?.roles ?? [];
    const management = hasAnyRole(roles, MANAGEMENT_ROLES);
    const commercial = hasAnyRole(roles, COMMERCIAL_ROLES);
    const workshop = hasAnyRole(roles, WORKSHOP_ROLES);

    useEffect(() => {
        if (!open) return;
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", closeOnEscape);
        return () => window.removeEventListener("keydown", closeOnEscape);
    }, [open]);

    return (
        <div className="admin-shell">
            <aside className={`sidebar ${open ? "sidebar--open" : ""}`}>
                 <div className="sidebar__top">
                    <AppLogo />
                    <button
                        className="icon-button sidebar__close"
                        type="button"
                        aria-label="Cerrar menú"
                        onClick={() => setOpen(false)}
                    >
                        <X />
                    </button>
                </div>
                <nav aria-label="Módulos del sistema" onClick={() => setOpen(false)}>
                    <NavItem to="/app" label="Inicio" icon={<Gauge />} />
                    {management && (
                        <NavItem
                            to="/app/dashboard"
                            label="Dashboard"
                            icon={<BarChart3 />}
                        />
                    )}
                    <NavItem to="/app/vehiculos" label="Vehículos" icon={<Car />} />
                    {commercial && (
                        <NavItem to="/app/clientes" label="Clientes" icon={<Contact />} />
                    )}{" "}
                    {commercial && (
                        <NavItem
                            to="/app/compras"
                            label="Compras"
                            icon={<ShoppingCart />}
                        />
                    )}{" "}
                    {commercial && (
                        <NavItem to="/app/ventas" label="Ventas" icon={<Receipt />} />
                    )}{" "}
                    {workshop && (
                        <NavItem to="/app/taller" label="Taller" icon={<Wrench />} />
                    )}{" "}
                    {management && (
                        <NavItem to="/app/costos" label="Costos" icon={<ClipboardList />} />
                    )}{" "}
                    {management && (
                        <NavItem to="/app/reportes" label="Reportes" icon={<FileText />} />
                    )}{" "}
                    {management && (
                        <NavItem
                            to="/app/auditoria"
                            label="Auditoría"
                            icon={<FileClock />}
                        />
                    )}{" "}
                    {management && (
                        <NavItem to="/app/usuarios" label="Usuarios" icon={<Users />} />
                    )}{" "}
                    {management && (
                        <NavItem
                            to="/app/parametros"
                            label="Parámetros"
                            icon={<Settings />}
                        />
                    )}
                </nav>
                <div className="sidebar__user">
                    <div>
                        <strong>{session?.nombre || session?.username}</strong>
                        <small>{roles.join(" · ")}</small>
                    </div>
                    <button
                        className="icon-button"
                        type="button"
                        title="Cerrar sesión"
                        aria-label="Cerrar sesión"
                        onClick={() => {
                            logout();
                            navigate("/login");
                        }}
                    >
                        <LogOut />
                    </button>
                </div>
            </aside>
            <div className="admin-main">
                <OfflineBanner />
                <header className="admin-topbar">
                    <button
                        className="icon-button menu-button"
                        type="button"
                        aria-label="Abrir menú"
                        aria-expanded={open}
                        onClick={() => setOpen(true)}
                    >
                        <Menu />
                    </button>
                    <span>Sistema de gestión</span>
                    <small>{session?.username}</small>
                </header>
                <main className="admin-content">
                    <Outlet />
                </main>
            </div>
            {open && (
                <button
                    type="button"
                    className="sidebar-backdrop"
                    aria-label="Cerrar menú"
                    onClick={() => setOpen(false)}
                />
            )}
        </div>
    );
}
