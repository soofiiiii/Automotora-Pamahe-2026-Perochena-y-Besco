/*
    Layout público de la aplicación.

    Un layout es una estructura base que se reutiliza en varias páginas.
    En este caso, PublicLayout define la estructura común para las vistas públicas
    del sistema, como el inicio, el catálogo o páginas informativas.

    Este componente no contiene lógica de guardado.
    No se comunica directamente con la API.
    Su función es organizar elementos permanentes de la interfaz:

    - Header público.
    - Logo.
    - Menú de navegación.
    - Botón de acceso interno.
    - Contenido dinámico mediante Outlet.
    - Footer público.
*/

import { NavLink, Outlet } from "react-router-dom";

/*
    AppLogo es el componente reutilizable del logo de Automotora Pamahe.

    Se usa en el header en versión completa y en el footer en versión compacta.
*/
import { AppLogo } from "../../shared/components/AppLogo/AppLogo";

/*
    AppButton es el botón reutilizable del sistema.

    En este layout se usa como enlace hacia el login interno.
*/
import { AppButton } from "../../shared/ui/AppButton/AppButton";

/*
    Estilos específicos del layout público.

    Este CSS define la apariencia del header, navegación, footer
    y distribución general del layout.
*/
import "./PublicLayout.css";

/*
    Componente PublicLayout.

    Este componente normalmente se usa dentro de AppRouter,
    como contenedor de rutas públicas.

    Por ejemplo:

    <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalogo" element={<CatalogPage />} />
    </Route>

    Las páginas hijas se renderizan en el lugar donde aparece <Outlet />.
*/
export function PublicLayout() {
  return (
    /*
        Contenedor general del layout público.

        Agrupa header, contenido principal dinámico y footer.
    */
    <div className="public-layout">

      {/*
          Encabezado público de la aplicación.

          Se muestra en la parte superior de las páginas públicas.
          Contiene el logo, la navegación principal y el botón de acceso interno.
      */}
      <header className="public-header">

        {/*
            page-container centra el contenido y limita el ancho máximo.

            public-header__content organiza internamente los elementos
            del header: logo, navegación y botón.
        */}
        <div className="page-container public-header__content">

          {/*
              Enlace hacia el inicio.

              NavLink permite navegar dentro de la aplicación sin recargar
              toda la página.

              aria-label="Ir al inicio" mejora la accesibilidad, indicando
              claramente qué hace este enlace.
          */}
          <NavLink to="/" aria-label="Ir al inicio">
            <AppLogo />
          </NavLink>

          {/*
              Navegación pública.

              Contiene enlaces visibles para usuarios que todavía no ingresaron
              al sistema interno.

              aria-label ayuda a identificar el propósito del bloque de navegación.
          */}
          <nav className="public-nav" aria-label="Navegación pública">

            {/*
                Enlace hacia la página principal.
            */}
            <NavLink to="/">Inicio</NavLink>

            {/*
                Enlace hacia el catálogo público de vehículos.
            */}
            <NavLink to="/catalogo">Catálogo</NavLink>

            {/*
                Enlace temporal hacia la sección de módulos.

                En esta primera base puede servir para mostrar o probar
                las rutas de los módulos internos.
            */}
            <NavLink to="/vehiculos">Módulos</NavLink>
          </nav>

          {/*
              Botón de acceso interno.

              Lleva al usuario hacia la pantalla de login.
              Usa la variante ghost porque es una acción importante,
              pero no necesita competir visualmente con el logo o el menú.
          */}
          <AppButton to="/login" variant="ghost">
            Acceso interno
          </AppButton>
        </div>
      </header>

      {/*
          Outlet representa el lugar donde React Router renderiza
          la página correspondiente a la ruta actual.

          Por ejemplo:
          - Si la ruta es "/", acá se muestra HomePage.
          - Si la ruta es "/catalogo", acá se muestra CatalogPage.
          - Si la ruta es "/vehiculos", acá se muestra la página correspondiente.

          PublicLayout no necesita saber exactamente qué página se mostrará.
          Solo reserva el espacio para que React Router la coloque.
      */}
      <Outlet />

      {/*
          Pie de página público.

          Se muestra al final de las páginas públicas.
          Contiene una versión compacta del logo y una descripción breve
          del sistema.
      */}
      <footer className="public-footer">
        <div className="page-container public-footer__content">

          {/*
              Logo compacto.

              Al pasar compact, AppLogo muestra solamente la marca visual
              sin el texto completo.
          */}
          <AppLogo compact />

          {/*
              Texto descriptivo del sistema.
          */}
          <p>
            Sistema Integral de Gestión y Comercialización para Automotora Pamahe.
          </p>
        </div>
      </footer>
    </div>
  );
}