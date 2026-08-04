/*
    App.tsx es el componente principal de la aplicación React.

    Este componente es renderizado desde main.tsx, por lo tanto,
    funciona como el primer componente propio del proyecto.

    En esta primera versión, App no contiene diseño visual directo,
    ni lógica de negocio, ni comunicación con la API.

    Su responsabilidad es simple y ordenada:
    cargar el sistema de rutas mediante AppRouter.

    Esto permite separar responsabilidades:

    - main.tsx se encarga de iniciar React.
    - App.tsx se encarga de cargar la estructura principal.
    - AppRouter se encarga de definir qué pantalla se muestra
      según la ruta actual del navegador.
*/

/*
    Se importa AppRouter desde la carpeta routes.

    AppRouter es el componente encargado de manejar las rutas
    de la aplicación.

    Por ejemplo, en el futuro puede definir rutas como:

    - /
    - /vehiculos
    - /clientes
    - /ventas
    - /compras
    - /refacciones

    De esta manera, App no necesita conocer cada pantalla.
    Solo necesita delegar la navegación a AppRouter.
*/
import { AppRouter } from "./routes/AppRouter";

/*
    Se declara y exporta el componente App.

    export permite que este componente pueda ser importado
    desde otros archivos, como ocurre en main.tsx:

    import { App } from "./App";

    function App() define un componente funcional de React.
    Un componente funcional es una función que retorna JSX,
    es decir, estructura visual similar a HTML pero usada dentro de React.
*/
export function App() {
  /*
      El componente retorna AppRouter.

      Esto significa que, cuando React renderiza App,
      en realidad se muestra el sistema de rutas definido dentro
      de AppRouter.

      AppRouter será quien decida qué página o componente corresponde
      mostrar según la URL actual.
  */
  return <AppRouter />;
}