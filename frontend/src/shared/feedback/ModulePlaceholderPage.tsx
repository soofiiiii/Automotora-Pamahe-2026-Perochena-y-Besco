/*
    Componente reutilizable para mostrar páginas temporales de módulos.

    Este componente sirve para representar vistas que todavía no están
    completamente desarrolladas.

    Por ejemplo:
    - Vehículos
    - Clientes
    - Taller
    - Compras
    - Ventas
    - Reportes

    En esta primera base, permite dejar las rutas funcionando
    sin tener todavía los ABM, formularios, listados ni conexión con la API.

    No guarda datos.
    No consulta el backend.
    No contiene lógica de negocio.

    Solo recibe un título y una descripción para mostrar una pantalla
    temporal ordenada.
*/

import { AppButton } from "../ui/AppButton/AppButton";

/*
    Tipo de propiedades que recibe ModulePlaceholderPage.

    title:
    Título principal que se mostrará en la pantalla.

    description:
    Texto explicativo sobre qué función tendrá ese módulo
    cuando se desarrolle completamente.
*/
type ModulePlaceholderPageProps = {
  title: string;
  description: string;
};

/*
    Componente ModulePlaceholderPage.

    Recibe title y description mediante props.
    Esto permite reutilizar el mismo componente para varias rutas.
*/
export function ModulePlaceholderPage({
  title,
  description,
}: ModulePlaceholderPageProps) {
  return (
    /*
        main representa el contenido principal de la página.

        placeholder-page es una clase global usada para centrar contenido
        en páginas temporales.
    */
    <main className="placeholder-page">

      {/*
          Tarjeta temporal.

          placeholder-card también viene de los estilos globales.
          Da una presentación simple y prolija mientras la vista real
          todavía no fue implementada.
      */}
      <section className="placeholder-card">

        {/*
            Título recibido por props.

            Esto permite que cada módulo muestre su propio nombre
            sin crear un componente diferente para cada caso.
        */}
        <h1>{title}</h1>

        {/*
            Descripción recibida por props.

            Explica brevemente qué se desarrollará en esa sección.
        */}
        <p>{description}</p>

        {/*
            Botón para volver al inicio.

            Como AppButton recibe la prop "to", funciona como enlace interno
            mediante react-router-dom.
        */}
        <AppButton to="/" variant="secondary">
          Volver al inicio
        </AppButton>
      </section>
    </main>
  );
}