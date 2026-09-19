import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import PrivateRoute from "./PrivateRoute";
import { AuthContext } from "../contexts/authContext";

function renderRoute(
  isAuthenticated: boolean,
  roles: string[] = [],
  initialPath = "/privado",
) {
  return render(
    <AuthContext.Provider
      value={{
        isAuthenticated,
        session: { roles },
      } as never}
    >
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/login" element={<div>Página de Login</div>} />
          <Route path="/app" element={<div>Inicio de la aplicación</div>} />

          <Route element={<PrivateRoute roles={["ADMINISTRADOR"]} />}>
            <Route
              path="/privado"
              element={<div>Contenido protegido</div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("PrivateRoute", () => {
  it("redirige al login cuando el usuario no está autenticado", () => {
    renderRoute(false);

    expect(screen.getByText("Página de Login")).toBeInTheDocument();
  });

  it("permite acceder cuando el usuario tiene el rol requerido", () => {
    renderRoute(true, ["ADMINISTRADOR"]);

    expect(screen.getByText("Contenido protegido")).toBeInTheDocument();
  });

  it("redirige a /app cuando el usuario no tiene el rol requerido", () => {
    renderRoute(true, ["VENDEDOR"]);

    expect(
      screen.getByText("Inicio de la aplicación"),
    ).toBeInTheDocument();
  });

  it("permite acceder a una ruta protegida con cualquier rol autorizado", () => {
    renderRoute(true, ["ADMINISTRADOR"]);

    expect(screen.queryByText("Página de Login")).not.toBeInTheDocument();
    expect(screen.getByText("Contenido protegido")).toBeInTheDocument();
  });
});