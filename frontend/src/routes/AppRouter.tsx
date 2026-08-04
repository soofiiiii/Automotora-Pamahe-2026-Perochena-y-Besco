/*
    Archivo encargado de definir las rutas principales de la aplicación.

    AppRouter centraliza la navegación del frontend.

    Su función es indicar qué componente debe mostrarse según la URL actual
    del navegador.

    Por ejemplo:
    - "/" muestra HomePage.
    - "/catalogo" muestra CatalogoPage.
    - "/vehiculos" muestra una página temporal del módulo vehículos.
    - "/login" muestra LoginPage.

    Este archivo no contiene lógica de guardado.
    No se comunica directamente con la API.
    Tampoco define estilos visuales propios.

    Su responsabilidad es conectar rutas con páginas.
*/

import { BrowserRouter, Route, Routes } from "react-router-dom";

/*
    PublicLayout es el layout público de la aplicación.

    Contiene elementos comunes como:
    - header,
    - navegación pública,
    - footer,
    - Outlet para mostrar la página correspondiente.

    Las rutas que estén dentro de PublicLayout se mostrarán con esa estructura.
*/
import { PublicLayout } from "../layouts/PublicLayout/PublicLayout";

/*
    Página temporal de login.

    Esta ruta se usa para el futuro acceso interno de usuarios del sistema.
*/
import { LoginPage } from "../modules/auth/pages/LoginPage";

/*
    Página temporal del catálogo público.

    Más adelante mostrará vehículos disponibles, imágenes, filtros
    y medios de contacto.
*/
import { CatalogoPage } from "../modules/catalogo/pages/CatalogoPage";

/*
    Página principal del frontend.

    Es el Home del sistema y se muestra en la ruta "/".
*/
import { HomePage } from "../modules/home/pages/HomePage";

/*
    Página placeholder reutilizable.

    Se usa para módulos que todavía no tienen una pantalla definitiva.
    Permite dejar rutas preparadas sin repetir código.
*/
import { ModulePlaceholderPage } from "../shared/feedback/ModulePlaceholderPage";

/*
    Componente principal de rutas.

    AppRouter es usado por App.tsx.
    Desde acá se controla toda la navegación inicial del frontend.
*/
export function AppRouter() {
  return (
    /*
        BrowserRouter habilita el sistema de rutas en el navegador.

        Permite que React Router lea la URL actual y muestre
        el componente correspondiente.

        También permite navegar internamente con Link, NavLink y AppButton
        sin recargar toda la página.
    */
    <BrowserRouter>

      {/*
          Routes agrupa todas las rutas disponibles.

          Dentro de Routes se declaran varios Route.
          Cada Route indica qué componente se muestra para una ruta específica.
      */}
      <Routes>

        {/*
            Ruta contenedora que usa PublicLayout.

            Esta Route no tiene path propio.
            Su función es envolver varias rutas hijas con el layout público.

            Todo lo que esté dentro de esta ruta se mostrará dentro del <Outlet />
            definido en PublicLayout.

            Es decir:
            PublicLayout muestra header y footer,
            y el contenido cambia según la ruta hija.
        */}
        <Route element={<PublicLayout />}>

          {/*
              Ruta principal del sitio.

              Cuando la URL es "/", se muestra HomePage dentro de PublicLayout.
          */}
          <Route path="/" element={<HomePage />} />

          {/*
              Ruta del catálogo público.

              Cuando la URL es "/catalogo", se muestra CatalogoPage
              dentro de PublicLayout.
          */}
          <Route path="/catalogo" element={<CatalogoPage />} />

          {/*
              Ruta temporal del módulo de vehículos.

              Todavía no existe el ABM real, por eso se usa
              ModulePlaceholderPage con un título y una descripción.
          */}
          <Route
            path="/vehiculos"
            element={
              <ModulePlaceholderPage
                title="Vehículos e inventario"
                description="Aquí se desarrollará el ABM de vehículos, control de estados, stock interno e historial operativo."
              />
            }
          />

          {/*
              Ruta temporal del módulo de clientes.

              En el futuro permitirá gestionar compradores y vendedores.
          */}
          <Route
            path="/clientes"
            element={
              <ModulePlaceholderPage
                title="Clientes"
                description="Aquí se desarrollará la gestión de clientes compradores y vendedores vinculados a operaciones comerciales."
              />
            }
          />

          {/*
              Ruta temporal del módulo de taller y refacciones.

              En el futuro permitirá registrar trabajos, costos,
              mano de obra, repuestos y seguimiento de tareas.
          */}
          <Route
            path="/taller"
            element={
              <ModulePlaceholderPage
                title="Taller y refacciones"
                description="Aquí se desarrollará el registro de trabajos, costos, mano de obra, repuestos y seguimiento de tareas."
              />
            }
          />

          {/*
              Ruta temporal del módulo de compras.

              En el futuro permitirá registrar el ingreso de vehículos,
              el cliente vendedor, el costo inicial y respaldos internos.
          */}
          <Route
            path="/compras"
            element={
              <ModulePlaceholderPage
                title="Compras"
                description="Aquí se desarrollará el registro de ingreso de vehículos, cliente vendedor, costo inicial y respaldo interno."
              />
            }
          />

          {/*
              Ruta temporal del módulo de ventas.

              En el futuro permitirá registrar el cierre comercial,
              cliente comprador, precio final y comprobante interno.
          */}
          <Route
            path="/ventas"
            element={
              <ModulePlaceholderPage
                title="Ventas"
                description="Aquí se desarrollará el cierre comercial del vehículo, cliente comprador, precio final y comprobante interno."
              />
            }
          />

          {/*
              Ruta temporal del módulo de reportes.

              En el futuro mostrará indicadores de stock, costos,
              ventas, refacciones y rentabilidad.
          */}
          <Route
            path="/reportes"
            element={
              <ModulePlaceholderPage
                title="Reportes"
                description="Aquí se desarrollarán indicadores de stock, costos, ventas, refacciones y rentabilidad."
              />
            }
          />
        </Route>

        {/*
            Ruta de login.

            Está fuera de PublicLayout, por lo tanto no se muestra
            con el header y footer públicos.

            Esto puede ser intencional, porque las pantallas de autenticación
            suelen tener una presentación propia y más simple.
        */}
        <Route path="/login" element={<LoginPage />} />

        {/*
            Ruta comodín o wildcard.

            path="*" significa:
            cualquier ruta que no coincida con las anteriores.

            Se usa para mostrar una pantalla de "Página no encontrada".

            Ejemplo:
            si el usuario entra a "/algo-que-no-existe",
            se mostrará este placeholder.
        */}
        <Route
          path="*"
          element={
            <ModulePlaceholderPage
              title="Página no encontrada"
              description="La ruta solicitada todavía no existe dentro del frontend."
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}