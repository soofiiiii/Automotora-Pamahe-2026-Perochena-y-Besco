/*
    Componente reutilizable para mostrar un paso de proceso.

    Este componente se utiliza en el home para representar una etapa
    dentro del flujo de trabajo de la automotora.

    Por ejemplo:
    - Ingreso y compra
    - Taller y refacciones
    - Disponibilidad comercial
    - Venta y cierre

    No contiene lógica de guardado.
    No se comunica directamente con la API.
    Solo recibe un objeto con información y la muestra en pantalla.
*/

import type { ProcessStepItem } from "../types/home.types";

/*
    Tipo de propiedades que recibe ProcessStep.

    item representa un paso del proceso.

    ProcessStepItem contiene:
    - number: número visual del paso.
    - title: título del paso.
    - description: explicación breve del paso.
*/
type ProcessStepProps = {
  item: ProcessStepItem;
};

/*
    Componente ProcessStep.

    Recibe un objeto item y muestra sus datos dentro de una tarjeta
    o bloque visual.
*/
export function ProcessStep({ item }: ProcessStepProps) {
  return (
    /*
        article representa una pieza de contenido independiente.

        En este caso, cada paso tiene sentido por sí mismo porque describe
        una etapa concreta del proceso operativo de la automotora.

        La clase process-step se usa para aplicar los estilos definidos
        en el CSS correspondiente.
    */
    <article className="process-step">

      {/*
          Número visual del paso.

          Se muestra como texto porque puede tener formato "01", "02", etc.
          Por eso en el tipo ProcessStepItem se definió como string
          y no como number.
      */}
      <span>{item.number}</span>

      {/*
          Título del paso.

          Resume la acción principal de esta etapa del proceso.
      */}
      <h3>{item.title}</h3>

      {/*
          Descripción breve del paso.

          Explica qué ocurre en esa parte del flujo de trabajo.
      */}
      <p>{item.description}</p>
    </article>
  );
}