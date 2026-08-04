/*
    Componente reutilizable para mostrar una tarjeta de módulo.

    Cada ModuleCard representa una sección funcional del sistema,
    como vehículos, clientes, taller, compras, ventas o reportes.

    Este componente no contiene lógica de guardado.
    Tampoco se comunica directamente con la API.

    Su función es mostrar información de un módulo y permitir
    la navegación hacia su ruta correspondiente mediante AppButton.
*/

/*
    Se importa el componente AppButton.

    AppButton es el botón reutilizable del sistema.
    En este caso se usa como botón de navegación, porque recibe la prop "to".

    Al recibir "to", AppButton internamente renderiza un <Link>
    de react-router-dom.
*/
import { AppButton } from "../../../shared/ui/AppButton/AppButton";

/*
    Se importa el tipo ModuleItem.

    ModuleItem define la estructura que debe tener cada módulo:
    - title
    - description
    - path
    - actionLabel

    Se usa import type porque solo se necesita para validar tipos
    durante el desarrollo con TypeScript.
*/
import type { ModuleItem } from "../types/home.types";

/*
    Tipo de propiedades que recibe ModuleCard.

    item representa el módulo que se quiere mostrar en la tarjeta.
*/
type ModuleCardProps = {
  item: ModuleItem;
};

/*
    Componente ModuleCard.

    Recibe un objeto item y muestra sus datos dentro de una tarjeta.
*/
export function ModuleCard({ item }: ModuleCardProps) {
  return (
    /*
        article representa una pieza independiente de contenido.

        En este caso, cada tarjeta tiene sentido por sí misma porque
        describe un módulo específico del sistema.

        La clase module-card se usa para aplicar los estilos visuales
        definidos en el CSS correspondiente del home.
    */
    <article className="module-card">

      {/*
          Contenedor interno para el texto de la tarjeta.

          Agrupa el título y la descripción del módulo.
          Esto ayuda a separar visualmente el contenido textual
          del botón de acción.
      */}
      <div>

        {/*
            Título del módulo.

            Ejemplos:
            - Vehículos e inventario
            - Clientes
            - Taller y refacciones
            - Ventas
        */}
        <h3>{item.title}</h3>

        {/*
            Descripción breve del módulo.

            Explica qué permite hacer esa sección del sistema.
        */}
        <p>{item.description}</p>
      </div>

      {/*
          Botón de acción del módulo.

          to={item.path} indica la ruta interna a la que debe navegar.
          Por ejemplo: "/vehiculos", "/clientes" o "/ventas".

          variant="ghost" indica que se usa una variante visual liviana,
          porque dentro de una tarjeta no siempre conviene usar
          un botón demasiado fuerte visualmente.

          El texto del botón viene desde item.actionLabel.
      */}
      <AppButton to={item.path} variant="ghost">
        {item.actionLabel}
      </AppButton>
    </article>
  );
}