/*
    Componente reutilizable para mostrar una tarjeta de resumen.

    Este componente se usa en el home para presentar indicadores generales
    del sistema, como cantidad de vehículos en stock, unidades en taller,
    ventas del mes o rentabilidad estimada.

    No contiene lógica de cálculo.
    No se comunica directamente con la API.
    Solo recibe un objeto con datos ya preparados y los muestra en pantalla.

    En esta primera versión, los datos vienen desde home.data.ts.
    Más adelante, esos datos podrían venir desde el backend.
*/

import type { SummaryItem } from "../types/home.types";

/*
    Tipo de propiedades que recibe SummaryCard.

    item representa un objeto de tipo SummaryItem.

    SummaryItem contiene:
    - title: título de la tarjeta.
    - value: valor principal destacado.
    - detail: descripción o aclaración breve.
*/
type SummaryCardProps = {
  item: SummaryItem;
};

/*
    Componente SummaryCard.

    Recibe una prop llamada item y muestra sus datos dentro de una tarjeta.

    El destructuring { item } permite acceder directamente a la propiedad
    enviada desde el componente padre.
*/
export function SummaryCard({ item }: SummaryCardProps) {
  return (
    /*
        article representa una pieza de contenido independiente.

        En este caso se usa porque cada tarjeta resume una información
        concreta del sistema.

        className="summary-card" conecta este componente con los estilos CSS
        que definen su apariencia visual.
    */
    <article className="summary-card">

      {/*
          Título o nombre del indicador.

          Ejemplo:
          "Vehículos en stock"
          "Ventas del mes"

          Se usa span porque es un texto breve y secundario dentro de la tarjeta.
      */}
      <span>{item.title}</span>

      {/*
          Valor principal de la tarjeta.

          Se usa strong porque este dato es el más importante visualmente.

          Ejemplo:
          "18"
          "7"
          "USD 14.800"
      */}
      <strong>{item.value}</strong>

      {/*
          Detalle o explicación breve del indicador.

          Sirve para darle contexto al valor mostrado.
      */}
      <p>{item.detail}</p>
    </article>
  );
}