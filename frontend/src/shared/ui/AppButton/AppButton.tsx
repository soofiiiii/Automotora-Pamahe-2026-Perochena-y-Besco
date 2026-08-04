/*
    Componente reutilizable para botones de la aplicación.

    AppButton permite usar una misma estructura visual para diferentes tipos
    de botones dentro del sistema.

    Puede funcionar de dos maneras:

    1. Como enlace interno de navegación:
       cuando recibe la prop "to", renderiza un componente <Link>.

    2. Como botón común:
       cuando no recibe "to", renderiza un <button> HTML.

    Esto permite reutilizar el mismo componente tanto para navegar entre páginas
    como para ejecutar acciones dentro de formularios o pantallas.
*/

/*
    ReactNode es un tipo de React que representa cualquier contenido
    que pueda mostrarse dentro de un componente.

    Por ejemplo:
    - texto,
    - íconos,
    - otros componentes,
    - fragmentos JSX.

    Se importa con "import type" porque solo se usa como tipo de TypeScript,
    no como valor en tiempo de ejecución.
*/
import type { ReactNode } from "react";

/*
    Link pertenece a react-router-dom.

    Se usa para navegar entre rutas internas de la aplicación
    sin recargar toda la página.

    Por ejemplo:
    <Link to="/vehiculos">Ver vehículos</Link>

    Esto es mejor que usar <a href=""> para navegación interna,
    porque mantiene el comportamiento de una SPA.
*/
import { Link } from "react-router-dom";

/*
    Se importan los estilos propios del botón.

    AppButton.css define cómo se ven las distintas variantes visuales:
    primary, secondary y ghost.
*/
import "./AppButton.css";

/*
    Tipo que define las variantes visuales permitidas para el botón.

    Esto limita los valores posibles de variant a:
    - "primary"
    - "secondary"
    - "ghost"

    Gracias a TypeScript, si se intenta usar otra variante no permitida,
    el editor mostrará un error antes de ejecutar la aplicación.
*/
type AppButtonVariant = "primary" | "secondary" | "ghost";

/*
    Tipo de propiedades que puede recibir AppButton.

    children:
    Contenido interno del botón. Puede ser texto, íconos u otros elementos.

    to:
    Ruta interna a la que debe navegar el botón.
    Es opcional. Si existe, el componente se renderiza como Link.

    type:
    Tipo del botón HTML.
    Puede ser "button", "submit" o "reset".
    Es útil especialmente cuando el botón está dentro de formularios.

    variant:
    Define el estilo visual del botón.
    Usa el tipo AppButtonVariant declarado arriba.

    className:
    Permite agregar clases CSS extra desde afuera del componente,
    en caso de necesitar un ajuste puntual.
*/
type AppButtonProps = {
    children: ReactNode;
    to?: string;
    type?: "button" | "submit" | "reset";
    variant?: AppButtonVariant;
    className?: string;
};

/*
    Se declara y exporta el componente AppButton.

    Las props se reciben mediante destructuring, es decir,
    se extraen directamente desde el objeto de propiedades.

    También se asignan valores por defecto:

    type = "button":
    evita que el botón se comporte como submit por accidente
    cuando está dentro de un formulario.

    variant = "primary":
    si no se indica una variante, se usa el estilo principal.

    className = "":
    evita problemas al concatenar clases si no se recibe ninguna clase extra.
*/
export function AppButton({
    children,
    to,
    type = "button",
    variant = "primary",
    className = "",
}: AppButtonProps) {

    /*
        Se construye el className final del botón.

        Siempre tendrá:
        - app-button: clase base del componente.
        - app-button--primary, app-button--secondary o app-button--ghost:
          clase modificadora según la variante elegida.
        - className: clases adicionales recibidas desde afuera.

        Ejemplo si variant es "secondary":

        app-button app-button--secondary

        El método trim() elimina espacios sobrantes al inicio o final.
    */
    const buttonClassName = `app-button app-button--${variant} ${className}`.trim();

    /*
        Si existe la prop "to", el componente funciona como enlace interno.

        En ese caso se retorna un <Link> de react-router-dom.

        Esto permite usar AppButton para navegar a otras pantallas,
        por ejemplo:

        <AppButton to="/vehiculos">
            Ver vehículos
        </AppButton>

        Importante:
        Link necesita que la aplicación esté envuelta en un router,
        normalmente BrowserRouter, dentro de AppRouter o en un nivel superior.
    */
    if (to) {
        return (
            <Link to={to} className={buttonClassName}>
                {children}
            </Link>
        );
    }

    /*
        Si no existe la prop "to", el componente funciona como botón normal.

        Este caso se usa para acciones como:
        - guardar,
        - cancelar,
        - abrir un modal,
        - enviar un formulario,
        - ejecutar una función.

        El atributo type define el comportamiento del botón.
    */
    return (
        <button type={type} className={buttonClassName}>
            {children}
        </button>
    );
}