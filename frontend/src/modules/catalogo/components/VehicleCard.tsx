import { Gauge, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { apiAssetUrl } from "../../../config/apiConfig";
import { DEFAULT_WHATSAPP } from "../../../config/appConfig";
import type { CatalogoVehiculo } from "../../../types/vehiculo.types";
import { formatCurrency } from "../../../utils/formatCurrency";

export default function VehicleCard({ vehicle }: { vehicle: CatalogoVehiculo; }) {
  const image = apiAssetUrl(vehicle.imagenes?.[0]);
  const wa = (vehicle.contactoWhatsapp || DEFAULT_WHATSAPP).replace(/\D/g, "");

  return (
    <article className="vehicle-card">
      <Link to={`/catalogo/${vehicle.id}`} className="vehicle-card__image" aria-label={`Ver ${vehicle.marca} ${vehicle.modelo}`}>
        {image ? (
          <img
            src={image}
            alt={`${vehicle.marca} ${vehicle.modelo} ${vehicle.anio}`}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="vehicle-card__placeholder">Sin foto</div>
        )}
        <span className="vehicle-card__used">Vehículo usado</span>
      </Link>
      <div className="vehicle-card__body">
        <div>
          <span className="vehicle-card__year">{vehicle.anio}</span>
          <h2>{vehicle.marca} {vehicle.modelo}</h2>
        </div>
        <div className="vehicle-card__meta">
          <span>
            <Gauge size={16} />
            {vehicle.kilometraje !== null && vehicle.kilometraje !== undefined
              ? `${Intl.NumberFormat("es-UY").format(vehicle.kilometraje)} km`
              : "Kilometraje a consultar"}
          </span>
          {vehicle.color && <span>{vehicle.color}</span>}
        </div>
        <strong className="vehicle-card__price">
          {vehicle.precioVentaEstimado
            ? formatCurrency(vehicle.precioVentaEstimado)
            : "Consultar precio"}
        </strong>
        <div className="vehicle-card__actions">
          <Link className="button button--secondary" to={`/catalogo/${vehicle.id}`}>
            Ver vehículo
          </Link>
          <a
            className="button button--accent"
            href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hola, consulto por el ${vehicle.marca} ${vehicle.modelo} ${vehicle.anio} (ID ${vehicle.id}).`)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Consultar por WhatsApp sobre: ${vehicle.marca} ${vehicle.modelo}`}
          >
            <MessageCircle size={18} />
          </a>
        </div>
      </div>
    </article>
  );
}
