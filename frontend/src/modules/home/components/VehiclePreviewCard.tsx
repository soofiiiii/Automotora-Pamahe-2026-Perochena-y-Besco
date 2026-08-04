/*
    Componente reutilizable para mostrar una vista previa de un vehículo.

    Este componente se usa en el home para presentar vehículos destacados
    o vehículos disponibles de forma resumida.

    No se comunica directamente con la API.
    En esta primera versión recibe datos desde home.data.ts.

    En una versión futura, esos datos podrían venir desde el backend,
    por ejemplo desde un endpoint de vehículos disponibles o destacados.

    Este componente se comunica con:
    - VehiclePreview, para conocer la estructura del vehículo.
    - StatusBadge, para mostrar visualmente el estado del vehículo.
    - formatCurrency, para mostrar el precio con formato de moneda.
    - El CSS del home, mediante clases como vehicle-card.
*/

import { formatCurrency } from "../../../utils/formatCurrency";
import { StatusBadge } from "../../../shared/ui/StatusBadge/StatusBadge";
import type { VehiclePreview } from "../types/home.types";

/*
    Tipo de propiedades que recibe VehiclePreviewCard.

    vehicle representa un objeto de tipo VehiclePreview.

    VehiclePreview contiene datos como:
    - marca,
    - modelo,
    - año,
    - precio,
    - kilometraje,
    - estado,
    - descripción.
*/
type VehiclePreviewCardProps = {
  vehicle: VehiclePreview;
};

/*
    Componente VehiclePreviewCard.

    Recibe un vehículo y muestra su información principal dentro de una tarjeta.
*/
export function VehiclePreviewCard({ vehicle }: VehiclePreviewCardProps) {
  /*
      Se generan iniciales a partir de la marca y el modelo del vehículo.

      vehicle.brand.charAt(0) toma la primera letra de la marca.
      vehicle.model.charAt(0) toma la primera letra del modelo.

      Por ejemplo:
      Toyota Corolla XEI

      brand.charAt(0) devuelve "T"
      model.charAt(0) devuelve "C"

      Resultado final:
      "TC"

      toUpperCase() asegura que las iniciales se muestren en mayúsculas.

      Estas iniciales se usan como imagen temporal del vehículo.
      Es útil en esta primera base porque todavía no se están manejando
      fotos reales de vehículos.
  */
  const initials = `${vehicle.brand.charAt(0)}${vehicle.model.charAt(0)}`.toUpperCase();

  return (
    /*
        article representa una pieza independiente de contenido.

        En este caso, cada tarjeta describe un vehículo específico.

        La clase vehicle-card permite aplicar estilos desde el CSS
        correspondiente del home.
    */
    <article className="vehicle-card">

      {/*
          Contenedor visual de la imagen del vehículo.

          Como todavía no se usan imágenes reales, se muestran iniciales.
          Más adelante este bloque podría reemplazarse por una etiqueta img.
      */}
      <div className="vehicle-card__image">
        <span>{initials}</span>
      </div>

      {/*
          Cuerpo principal de la tarjeta.

          Contiene el estado, nombre del vehículo, descripción,
          datos técnicos resumidos y precio.
      */}
      <div className="vehicle-card__body">

        {/*
            Badge visual del estado del vehículo.

            StatusBadge recibe vehicle.status y decide qué color mostrar
            según el estado:

            - Disponible
            - En taller
            - Reservado
        */}
        <StatusBadge status={vehicle.status} />

        {/*
            Título de la tarjeta.

            Combina marca y modelo para mostrar el nombre comercial
            del vehículo.
        */}
        <h3>
          {vehicle.brand} {vehicle.model}
        </h3>

        {/*
            Descripción breve del vehículo.

            Sirve para dar contexto comercial o indicar su situación actual.
        */}
        <p>{vehicle.description}</p>

        {/*
            Lista de descripción.

            Se usa dl porque se muestran pares de dato y valor.

            dt representa el nombre del dato.
            dd representa el valor del dato.

            En este caso:
            - Año: 2018
            - Kilometraje: 92.000 km
        */}
        <dl>
          <div>
            <dt>Año</dt>
            <dd>{vehicle.year}</dd>
          </div>

          <div>
            <dt>Kilometraje</dt>

            {/*
                toLocaleString("es-UY") formatea el número según Uruguay.

                Por ejemplo:
                92000 se muestra como 92.000

                Luego se agrega "km" como unidad.
            */}
            <dd>{vehicle.mileage.toLocaleString("es-UY")} km</dd>
          </div>
        </dl>

        {/*
            Precio del vehículo.

            Se usa formatCurrency para mostrar el número como moneda.

            Por ejemplo:
            18500

            se muestra como:
            US$ 18.500

            Esto evita repetir lógica de formato en cada componente.
        */}
        <strong>{formatCurrency(vehicle.price)}</strong>
      </div>
    </article>
  );
}