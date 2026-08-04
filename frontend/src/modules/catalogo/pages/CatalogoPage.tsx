/*
    Página temporal del catálogo público.

    Esta vista funciona como una base inicial mientras todavía
    no se desarrolla el catálogo completo.

    Su objetivo es dejar preparada la ruta "/catalogo" y mostrar
    al usuario que esta sección estará destinada a visualizar vehículos
    disponibles para la venta.

    En esta primera versión:
    - no hay conexión con la API,
    - no se cargan vehículos reales,
    - no hay filtros,
    - no hay imágenes,
    - no hay lógica de contacto.

    Más adelante, esta página podrá evolucionar para mostrar:
    - listado de vehículos disponibles,
    - imágenes de cada unidad,
    - filtros por marca, modelo, año, precio o estado,
    - datos comerciales,
    - botones de consulta o contacto.
*/

/*
    Se importa AppButton, el botón reutilizable del sistema.

    En este caso se utiliza como enlace para volver al inicio.
    Como recibe la prop "to", AppButton internamente funciona
    como un Link de react-router-dom.
*/
import { AppButton } from "../../../shared/ui/AppButton/AppButton";

/*
    Componente CatalogoPage.

    Representa la página pública del catálogo de vehículos.
    Se exporta para poder utilizarla dentro de AppRouter.
*/
export function CatalogoPage() {
  return (
    /*
        main representa el contenido principal de esta pantalla.

        La clase placeholder-page ya fue definida en los estilos globales.
        Sirve para centrar una tarjeta temporal dentro de la página.
    */
    <main className="placeholder-page">

      {/*
          Sección visual temporal.

          placeholder-card también viene de los estilos globales.
          Define una tarjeta centrada, con fondo blanco, sombra,
          bordes redondeados y texto alineado al centro.
      */}
      <section className="placeholder-card">

        {/*
            Título principal de la página.

            Se usa h1 porque esta vista tiene su propio encabezado principal.
        */}
        <h1>Catálogo público</h1>

        {/*
            Descripción temporal de la funcionalidad futura.

            Explica qué propósito tendrá esta pantalla cuando
            esté completamente desarrollada.
        */}
        <p>
          Esta vista será utilizada para mostrar vehículos disponibles con imágenes,
          datos comerciales, filtros y medios de contacto.
        </p>

        {/*
            Botón para volver a la página principal.

            to="/" indica que al presionarlo se navega al Home.

            variant="secondary" aplica la variante visual secundaria
            definida en AppButton.css.
        */}
        <AppButton to="/" variant="secondary">
          Volver al inicio
        </AppButton>
      </section>
    </main>
  );
}