import { Outlet, Link } from "react-router-dom";
import { AppLogo } from "../../shared/components/AppLogo";

export default function AuthLayout() {
    return (
        <main className="auth-shell">
            <section className="auth-panel">
                <Link to="/">
                    <AppLogo />
                </Link>
                <Outlet />
            </section>
            <aside className="auth-aside">
                <span className="eyebrow">Sistema interno</span>
                <h1>La operación de cada vehículo, en un solo lugar.</h1>
                <p>
                    Inventario, taller, compras, ventas y control económico conectados con
                    el stock real.
                </p>
            </aside>
        </main>
    );
}
