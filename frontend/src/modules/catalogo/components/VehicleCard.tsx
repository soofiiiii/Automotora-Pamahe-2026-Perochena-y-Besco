import { memo } from "react";
import { ArrowRight, Gauge, MessageCircle, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { apiAssetUrl } from "../../../config/apiConfig";
import { DEFAULT_PHONE, DEFAULT_WHATSAPP } from "../../../config/appConfig";
import type { CatalogoVehiculo } from "../../../types/vehiculo.types";
import { formatCurrency } from "../../../utils/formatCurrency";
import { StatusBadge } from "../../../shared/ui/StatusBadge";

interface Props {
  vehicle: CatalogoVehiculo;
  index?: number;
  priority?: boolean;
}

export const VehicleCard = memo(function VehicleCard({
  vehicle,
  index = 0,
  priority = false,
}: Props) {
  const image = apiAssetUrl(vehicle.imagenes?.[0]);
  const whatsapp = (vehicle.contactoWhatsapp || DEFAULT_WHATSAPP).replace(/\D/g, "");
  const phone = (vehicle.contactoTelefono || DEFAULT_PHONE).trim();
  const phoneHref = phone.replace(/[^\d+]/g, "");
  const name = `${vehicle.marca} ${vehicle.modelo} ${vehicle.anio}`;
  const interestMessage = `Hola, estoy interesado en el ${vehicle.marca} ${vehicle.modelo}`;

  return (
    <article
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
      className="group flex w-full flex-col overflow-hidden border border-brand-deep/10 bg-white shadow-sm transition-[box-shadow,border-color] duration-200 motion-safe:animate-card-in hover:border-brand/25 hover:shadow-lift"
    >
      <Link
        to={`/catalogo/${vehicle.id}`}
        aria-label={`Ver ficha de ${name}`}
        className="relative block aspect-[4/3] overflow-hidden bg-brand/[0.05]"
      >
        {image ? (
          <img
            src={image}
            alt={name}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
          />
        ) : (
          <div className="grid h-full place-items-center bg-[linear-gradient(135deg,#eef1f5,#f8f9fb)] text-sm font-semibold text-brand-deep/70">
            Sin fotografía
          </div>
        )}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <span className="bg-white/95 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.06em] text-brand-deep shadow-sm">
            Usado
          </span>
          {vehicle.estado === "RESERVADO" && <StatusBadge value="RESERVADO" />}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="mb-1 text-sm font-extrabold text-brand">Año {vehicle.anio}</p>
        <Link to={`/catalogo/${vehicle.id}`} className="block">
          <h2 className="m-0 text-[1.3rem] font-black leading-tight tracking-[-0.025em] text-[#17191d] transition-colors group-hover:text-brand">
            {vehicle.marca} {vehicle.modelo}
          </h2>
        </Link>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Gauge aria-hidden="true" className="size-4 text-brand/70" />
            {vehicle.kilometraje !== null && vehicle.kilometraje !== undefined
              ? `${Intl.NumberFormat("es-UY").format(vehicle.kilometraje)} km`
              : "Km a consultar"}
          </span>
          {vehicle.tipoVehiculo && (
            <span>{vehicle.tipoVehiculoLabel ?? vehicle.tipoVehiculo ?? "Sin especificar"}</span>
          )}
        </div>

        {vehicle.color && (
          <p className="mb-0 mt-2 text-sm text-slate-500">Color: {vehicle.color}</p>
        )}

        <strong className="mt-5 block text-[1.6rem] font-black tracking-[-0.035em] text-brand-deep">
          {vehicle.precioVentaEstimado
            ? formatCurrency(vehicle.precioVentaEstimado)
            : "Consultar precio"}
        </strong>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-brand/10 pt-4">
          <Link
            to={`/catalogo/${vehicle.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-extrabold uppercase tracking-[0.04em] text-brand hover:text-brand-deep"
          >
            Ver ficha <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
          <div className="flex items-center gap-2">
            <a
              href={`tel:${phoneHref}`}
              aria-label={`Llamar por ${name}`}
              className="inline-grid size-10 place-items-center rounded-full border border-brand/20 bg-white text-brand transition-transform hover:scale-105"
            >
              <Phone aria-hidden="true" className="size-4" />
            </a>
            <a
              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(interestMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Consultar por WhatsApp sobre ${name}`}
              className="inline-grid size-10 place-items-center rounded-full bg-sun text-brand-deep transition-transform hover:scale-105"
            >
              <MessageCircle aria-hidden="true" className="size-4" />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
});

export default VehicleCard;
