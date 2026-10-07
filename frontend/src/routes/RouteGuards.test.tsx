// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { AuthSession } from "../types/auth.types";
import PrivateRoute from "./PrivateRoute";
import PublicRoute from "./PublicRoute";

const authState = vi.hoisted(() => ({
  isAuthenticated: false,
  initializing: false,
  session: null as AuthSession | null,
}));

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => authState,
}));

const session = (roles: string[], debeCambiarPassword = false): AuthSession => ({
  token: "token-de-prueba-con-longitud-suficiente-123456",
  username: "usuario",
  nombre: "Usuario",
  roles,
  debeCambiarPassword,
});

function renderPrivate(path = "/privado") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          element={<PrivateRoute roles={["ADMINISTRADOR", "DUENO"]} />}
        >
          <Route path="/privado" element={<div>Contenido protegido</div>} />
          <Route
            path="/app/mi-cuenta/password"
            element={<div>Cambio de contraseña</div>}
          />
        </Route>
        <Route path="/login" element={<div>Página de acceso</div>} />
        <Route path="/app" element={<div>Inicio interno</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderPublic(path = "/login") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<div>Página de acceso</div>} />
        </Route>
        <Route path="/app" element={<div>Inicio interno</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  authState.isAuthenticated = false;
  authState.initializing = false;
  authState.session = null;
});

afterEach(() => cleanup());

describe("protección de rutas", () => {
  it("mantiene la pantalla de carga mientras se valida la sesión", () => {
    authState.initializing = true;
    renderPrivate();

    expect(screen.getByText("Validando sesión…")).toBeInTheDocument();
    expect(screen.queryByText("Contenido protegido")).not.toBeInTheDocument();
  });

  it("redirige al acceso cuando no existe una sesión autenticada", () => {
    renderPrivate();
    expect(screen.getByText("Página de acceso")).toBeInTheDocument();
  });

  it("fuerza el cambio de contraseña antes de continuar", () => {
    authState.isAuthenticated = true;
    authState.session = session(["ADMINISTRADOR"], true);

    renderPrivate();
    expect(screen.getByText("Cambio de contraseña")).toBeInTheDocument();
  });

  it("redirige al inicio cuando el rol no está autorizado", () => {
    authState.isAuthenticated = true;
    authState.session = session(["VENDEDOR"]);

    renderPrivate();
    expect(screen.getByText("Inicio interno")).toBeInTheDocument();
  });

  it("renderiza la ruta cuando el usuario posee un rol permitido", () => {
    authState.isAuthenticated = true;
    authState.session = session(["DUENO"]);

    renderPrivate();
    expect(screen.getByText("Contenido protegido")).toBeInTheDocument();
  });

  it("deja disponible el acceso para usuarios anónimos", () => {
    renderPublic();
    expect(screen.getByText("Página de acceso")).toBeInTheDocument();
  });

  it("evita volver al acceso cuando ya existe una sesión", () => {
    authState.isAuthenticated = true;
    authState.session = session(["ADMINISTRADOR"]);

    renderPublic();
    expect(screen.getByText("Inicio interno")).toBeInTheDocument();
  });
});
