import { Car, MessageCircle } from "lucide-react";
import { DEFAULT_WHATSAPP } from "../../../config/appConfig";
import type { CatalogoVehiculo } from "../../../types/vehiculo.types";
import { btnGhost, btnPrimary, cx } from "./catalogStyles";
import VehicleCard from "./VehicleCard";

const gridClass = "grid gap-5 sm:grid-cols-2 xl:grid-cols-3";

function SkeletonCard() {
  return (
    <div aria-hidden="true" className="overflow-hidden border border-brand/10 bg-white motion-safe:animate-pulse">
      <div className="aspect-[4/3] bg-brand/10" />
      <div className="grid gap-4 p-5">
        <div className="h-4 w-1/4 bg-brand/10" />
        <div className="h-7 w-3/4 bg-brand/10" />
        <div className="h-4 w-1/2 bg-brand/[0.07]" />
        <div className="h-8 w-2/5 bg-brand/10" />
        <div className="h-10 border-t border-brand/10" />
      </div>
    </div>
  );
}

export function VehicleGrid({
  vehicles,
  loading = false,
  onReset,
}: {
  vehicles: CatalogoVehiculo[];
  loading?: boolean;
  onReset: () => void;
}) {
  if (loading) {
    return (
      <div className={gridClass} aria-busy="true">
        {Array.from({ length: 6 }, (_, index) => <SkeletonCard key={index} />)}
      </div>
    );
  }

  if (vehicles.length === 0) {
    const whatsapp = DEFAULT_WHATSAPP.replace(/\D/g, "");
    return (
      <div className="grid place-items-center gap-4 border border-dashed border-brand/25 bg-white px-6 py-16 text-center">
        <Car aria-hidden="true" className="size-10 text-brand" />
        <h2 className="m-0 text-2xl font-black tracking-tight text-brand-deep">No hay vehículos con esos filtros</h2>
        <p className="m-0 max-w-md text-slate-600">
          Ampliá el rango de año o precio, o contanos por WhatsApp qué estás buscando.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" onClick={onReset} className={cx(btnGhost, "h-12")}>
            Quitar filtros
          </button>
          <a
            href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Hola Pamahe, busco un vehículo que no encontré en el catálogo: ")}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cx(btnPrimary, "h-12")}
          >
            <MessageCircle aria-hidden="true" className="size-5" />
            Contar qué busco
          </a>
        </div>
      </div>
    );
  }

  return (
    <ul className={`${gridClass} m-0 list-none p-0`}>
      {vehicles.map((vehicle, index) => (
        <li key={vehicle.id} className="flex">
          <VehicleCard vehicle={vehicle} index={index} priority={index < 3} />
        </li>
      ))}
    </ul>
  );
}
