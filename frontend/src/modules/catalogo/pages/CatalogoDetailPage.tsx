import { ArrowLeft, Gauge, MessageCircle, Phone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiAssetUrl } from "../../../config/apiConfig";
import { DEFAULT_WHATSAPP } from "../../../config/appConfig";
import { catalogoService } from "../../../services/api";
import type { CatalogoVehiculo } from "../../../types/vehiculo.types";
import { LoadingState } from "../../../shared/feedback/LoadingState";
import { ErrorState } from "../../../shared/feedback/ErrorState";
import { formatCurrency } from "../../../utils/formatCurrency";
import { errorMessage } from "../../../utils/errorMessage";

export default function CatalogoDetailPage() {
  const id = Number(useParams().id);
  const validId = Number.isInteger(id) && id > 0;
  const [vehicle, setVehicle] = useState<CatalogoVehiculo | null | undefined>(
    undefined,
  );
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(0);

  const load = async () => {
    if (!validId) return;

    setError("");
    setVehicle(undefined);

    try {
      setVehicle(await catalogoService.get(id));
    } catch (e) {
      setError(errorMessage(e));
      setVehicle(null);
    }
  };

  useEffect(() => {
    if (!validId) return;

    let cancelled = false;

    catalogoService
      .get(id)
      .then((data) => {
        if (!cancelled) {
          setVehicle(data);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setError(errorMessage(error));
          setVehicle(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, validId]);

  const images = useMemo(
    () => (vehicle?.imagenes ?? []).map(apiAssetUrl).filter(Boolean),
    [vehicle],
  );

  if (!validId) {
    return (
      <div className="container public-detail">
        <div className="state-card">
          <h1>Vehículo no disponible</h1>
          <p>El identificador del vehículo no es válido.</p>
          <Link className="button" to="/catalogo">
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  if (vehicle === undefined) {
    return (
      <div className="container public-detail">
        <LoadingState label="Cargando vehículo…" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="container public-detail">
        {error ? (
          <ErrorState
            title="No pudimos cargar el vehículo"
            description={error}
            onRetry={() => void load()}
          />
        ) : (
          <div className="state-card">
            <h1>Vehículo no disponible</h1>
            <p>Puede haber sido reservado, vendido o retirado del catálogo.</p>
            <Link className="button" to="/catalogo">
              Volver al catálogo
            </Link>
          </div>
        )}
      </div>
    );
  }

  const wa = (vehicle.contactoWhatsapp || DEFAULT_WHATSAPP).replace(/\D/g, "");
  const currentImage = images[selected] ?? images[0];

  return (
    <div className="container public-detail">
      <Link className="back-link" to="/catalogo">
        <ArrowLeft />
        Volver al catálogo
      </Link>
      <div className="public-detail__grid">
        <section aria-label="Galería de imágenes">
          <div className="gallery-main">
            {currentImage ? (
              <img
                src={currentImage}
                alt={`${vehicle.marca} ${vehicle.modelo} ${vehicle.anio}`}
              />
            ) : (
              <div className="vehicle-card__placeholder">Sin fotografía</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="gallery-thumbs">
              {images.slice(0, 8).map((img, index) => (
                <button
                  className={
                    index === selected
                      ? "gallery-thumb gallery-thumb--active"
                      : "gallery-thumb"
                  }
                  type="button"
                  key={`${img}-${index}`}
                  onClick={() => setSelected(index)}
                  aria-label={`Ver fotografía ${index + 1}`}
                >
                  <img src={img} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="vehicle-offer">
          <span className="vehicle-used-label">Vehículo usado</span>
          <span className="eyebrow">{vehicle.anio}</span>
          <h1>
            {vehicle.marca} {vehicle.modelo}
          </h1>
          <strong className="vehicle-offer__price">
            {vehicle.precioVentaEstimado
              ? formatCurrency(vehicle.precioVentaEstimado)
              : "Consultar precio"}
          </strong>
          <div className="vehicle-offer__facts">
            <span>
              <Gauge />
              {vehicle.kilometraje !== null && vehicle.kilometraje !== undefined
                ? `${Intl.NumberFormat("es-UY").format(vehicle.kilometraje)} km`
                : "Kilometraje a consultar"}
            </span>
            {vehicle.color && <span>Color: {vehicle.color}</span>}
          </div>
          {vehicle.descripcionPublica && <p>{vehicle.descripcionPublica}</p>}
          <a
            className="button button--accent"
            href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hola, me interesa el ${vehicle.marca} ${vehicle.modelo} ${vehicle.anio} (ID ${vehicle.id}).`)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle />
            Consultar por WhatsApp
          </a>
          {vehicle.contactoTelefono && (
            <a
              className="button button--secondary"
              href={`tel:${vehicle.contactoTelefono}`}
            >
              <Phone />
              Llamar {vehicle.contactoTelefono}
            </a>
          )}
          <small>
            Confirmá con la automotora disponibilidad, precio final,
            documentación, condiciones de pago y garantía cuando corresponda
            antes de concretar la operación.
          </small>
          <Link className="legal-inline-link" to="/informacion-legal">
            Información al consumidor
          </Link>
        </aside>
      </div>
    </div>
  );
}
