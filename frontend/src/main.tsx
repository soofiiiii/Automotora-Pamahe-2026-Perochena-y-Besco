/*
    Este archivo es el punto de entrada de la aplicación React.

    Su responsabilidad principal es conectar React con el HTML base
    del proyecto y cargar el componente principal App.

    En una aplicación creada con Vite + React + TypeScript,
    este archivo suele llamarse main.tsx.

    No contiene pantallas, rutas ni lógica de negocio.
    Tampoco se comunica directamente con la API.

    Lo que hace es:
    1. Importar React.
    2. Importar ReactDOM, que permite renderizar componentes React
       dentro del navegador.
    3. Importar el componente principal App.
    4. Importar los estilos globales.
    5. Renderizar App dentro del elemento HTML con id="root".
*/

import React from "react";

/*
    ReactDOM permite conectar React con el DOM real del navegador.

    El DOM es la estructura HTML que el navegador interpreta.
    React trabaja con componentes, pero esos componentes finalmente
    deben mostrarse dentro de un elemento HTML real.

    En este caso se importa desde "react-dom/client" porque React 18+
    utiliza createRoot como forma moderna de iniciar la aplicación.
*/
import ReactDOM from "react-dom/client";

/*
    Se importa el componente principal de la aplicación.

    App funciona como la raíz interna del frontend.
    Desde App normalmente se cargan:
    - rutas,
    - layouts,
    - páginas,
    - componentes generales,
    - navegación principal.

    Este archivo main.tsx no necesita conocer todos esos detalles.
    Solo necesita renderizar App.
*/
import { App } from "./App";

/*
    Se importan los estilos globales de la aplicación.

    Este archivo CSS contiene configuraciones base como:
    - variables visuales,
    - estilos generales del body,
    - contenedores reutilizables,
    - normalización de enlaces, imágenes y formularios.

    Al importarlo acá, los estilos quedan disponibles para toda
    la aplicación desde el inicio.
*/
import "./styles/global.css";


/*
    ReactDOM.createRoot(...) crea la raíz de React dentro del HTML.

    document.getElementById("root") busca en el archivo index.html
    un elemento con id="root".

    Normalmente en Vite ese elemento se encuentra así:

    <div id="root"></div>

    Ese div está vacío al principio.
    React lo usa como contenedor para mostrar toda la aplicación.
*/
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  /*
      React.StrictMode es una herramienta de desarrollo.

      No muestra nada visual en pantalla.
      Su función es ayudar a detectar posibles problemas en los componentes,
      como efectos mal definidos, renderizados innecesarios o prácticas
      poco recomendadas.

      Es importante saber que StrictMode puede ejecutar algunas funciones
      más de una vez en modo desarrollo, pero eso no ocurre igual en producción.

      Se usa para mejorar la calidad del código mientras se desarrolla.
  */
  <React.StrictMode>
    {/*
        App es el componente principal que se renderiza dentro del root.

        A partir de este componente comienza toda la interfaz del sistema:
        el home, las rutas, el layout, la navegación y las futuras vistas
        de vehículos, clientes, compras, ventas o refacciones.
    */}
    <App />
  </React.StrictMode>
);