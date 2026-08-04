/*
    Se importa el archivo CSS propio del componente.

    AppLogo.css contiene los estilos específicos del logo:
    tamaño, colores, distribución, espaciado y apariencia visual.

    Este componente se comunica visualmente con ese archivo CSS
    mediante las clases:

    - app-logo
    - app-logo__mark
    - app-logo__text

    La lógica está en este archivo TSX.
    La presentación visual está en AppLogo.css.
*/
import "./AppLogo.css";

/*
    Se define el tipo de propiedades que puede recibir el componente.

    En React con TypeScript, las props son datos que un componente
    puede recibir desde otro componente padre.

    En este caso, AppLogo puede recibir una propiedad llamada compact.

    compact?: boolean significa:
    - compact es opcional, por eso lleva el signo ?
    - si se envía, debe ser un valor booleano: true o false

    Esta propiedad sirve para decidir si el logo se muestra completo
    o en una versión reducida.
*/
type AppLogoProps = {
    compact?: boolean;
};

/*
    Se declara y exporta el componente AppLogo.

    Al exportarlo, puede ser utilizado en otras partes del sistema,
    por ejemplo en un Header, Navbar o Sidebar.

    Ejemplo de uso:

    <AppLogo />

    o también:

    <AppLogo compact />

    En el primer caso se muestra el logo completo.
    En el segundo caso se muestra solamente la marca compacta.
*/
export function AppLogo({ compact = false}: AppLogoProps) {
    
    /*
        Se retorna la estructura visual del logo usando JSX.

        JSX permite escribir una estructura similar a HTML
        dentro de un componente React.

        En este caso, el logo está formado por:
        - un contenedor principal,
        - una marca visual con la letra "P",
        - un texto descriptivo que se muestra solo si compact es false.
    */
    return (

        /*
            Contenedor principal del logo.

            className="app-logo" conecta este elemento con los estilos
            definidos en AppLogo.css.

            aria-label="Automotora Pamahe" mejora la accesibilidad.
            Esto permite que lectores de pantalla puedan identificar
            correctamente qué representa este bloque visual.

            Aunque el logo tenga texto visible, aria-label ayuda a que
            el componente sea más claro para tecnologías de asistencia.
        */
        <div className="app-logo" aria-label="Automotora Pamahe">
            {/*
                Marca visual del logo.

                En esta primera versión no se usa una imagen,
                sino una letra "P" como identificador gráfico de Pamahe.

                Esto permite tener un logo simple, liviano y fácil de estilizar
                desde CSS, sin depender todavía de archivos de imagen.
            */}
            <span className="app-logo__mark">P</span>

            {/*
                Renderizado condicional.

                Esta parte significa:

                "Si compact es false, mostrar el bloque de texto".

                El operador !compact pregunta si compact NO está activo.

                Entonces:

                - Si compact vale false:
                  se muestra "Automotora Pamahe" y "Gestión integral".

                - Si compact vale true:
                  este bloque no se muestra y queda solo la letra "P".

                Esto permite reutilizar el mismo componente en distintos lugares.
                Por ejemplo, en un header amplio puede mostrarse completo,
                pero en una barra lateral angosta puede mostrarse compacto.
            */}
            {!compact && (
                 /*
                    Bloque de texto del logo.

                    app-logo__text sigue una convención de nombres común
                    en CSS llamada BEM.

                    En este caso:
                    - app-logo es el bloque principal.
                    - app-logo__text es un elemento interno del bloque.
                */
                <div className="app-logo__text">
                    {/*
                        Nombre principal de la empresa.

                        Se usa strong porque representa el texto más importante
                        dentro del logo.
                    */}
                    <strong>Automotora Pamahe</strong>
                    {/*
                        Texto secundario del logo.

                        "Gestión integral" comunica brevemente el propósito
                        del sistema: no es solo una página visual, sino una base
                        para gestionar vehículos, clientes, ventas y refacciones.
                    */}
                    <span>Gestión integral</span>
                </div> 
            )}
        </div>
    );
}