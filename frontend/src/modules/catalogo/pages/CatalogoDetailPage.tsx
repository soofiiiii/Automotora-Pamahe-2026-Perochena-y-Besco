import axios from "axios";
import {
  ArrowLeft,
  CarFront,
  Gauge,
  MessageCircle,
  Palette,
  Phone,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiAssetUrl } from "../../../config/apiConfig";
import { DEFAULT_PHONE, DEFAULT_PHONE_DISPLAY, DEFAULT_WHATSAPP } from "../../../config/appConfig";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { catalogoService } from "../../../services/api";
import { ErrorState } from "../../../shared/feedback/ErrorState";
import { LoadingState } from "../../../shared/feedback/LoadingState";
import { SeoMeta } from "../../../shared/seo/SeoMeta";
import { StatusBadge } from "../../../shared/ui/StatusBadge";
import { ImageLightbox } from "../../../shared/ui/ImageLightbox";
import { formatUsd, formatUyuEquivalent } from "../../../utils/formatCurrency";

export default function CatalogoDetailPage() {
  const id = Number(useParams().id);
  const validId = Number.isInteger(id) && id > 0;
  const [selection, setSelection] = useState({ vehicleId: id, index: 0 });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const selected = selection.vehicleId === id ? selection.index : 0;

  const load = useCallback(
    async (signal: AbortSignal) => {
      if (!Number.isSafeInteger(id) || id <= 0) return null;
      try {
        return await catalogoService.get(id, signal);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) return null;
        throw error;
      }
    },
    [id],
  );

  const { data: vehicle, loading, error, retry } = useApiQuery(load);
  const images = useMemo(
    () => (vehicle?.imagenes ?? []).map(apiAssetUrl).filter(Boolean),
    [vehicle],
  );

  if (!validId) {
    return (
      <div className="mx-auto w-full max-w-[1320px] px-4 py-12 sm:px-6">
        <div className="state-card">
          <h1>Vehículo no disponible</h1>
          <p>El enlace del vehículo no es válido.</p>
          <Link className="button" to="/catalogo">Volver al catálogo</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1320px] px-4 py-12 sm:px-6">
        <LoadingState label="Cargando vehículo…" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="mx-auto w-full max-w-[1320px] px-4 py-12 sm:px-6">
        {error ? (
          <ErrorState title="No pudimos cargar el vehículo" description={error} onRetry={retry} />
        ) : (
          <div className="state-card">
            <h1>Vehículo no disponible</h1>
            <p>Puede haber sido vendido, dado de baja o retirado del catálogo.</p>
            <Link className="button" to="/catalogo">Volver al catálogo</Link>
          </div>
        )}
      </div>
    );
  }

  const wa = (vehicle.contactoWhatsapp || DEFAULT_WHATSAPP).replace(/\D/g, "");
  const phone = (vehicle.contactoTelefono || DEFAULT_PHONE).trim();
  const phoneDisplay = vehicle.contactoTelefono?.trim() || DEFAULT_PHONE_DISPLAY;
  const phoneHref = phone.replace(/[^\d+]/g, "");
  const currentImage = images[selected] ?? images[0];
  const vehicleName = `${vehicle.marca} ${vehicle.modelo} ${vehicle.anio}`;
  const interestMessage = `Hola, estoy interesado en el ${vehicle.marca} ${vehicle.modelo}`;
  const description = vehicle.descripcionPublica?.trim()
    ? vehicle.descripcionPublica.trim().slice(0, 155)
    : `${vehicleName} usado ${vehicle.estado === "RESERVADO" ? "reservado" : "disponible"} en Automotora Pamahe. Consultá precio, kilometraje, características y disponibilidad.`;

  return (
    <div className="bg-paper pb-16">
      <SeoMeta
        title={`${vehicleName} | Automotora Pamahe`}
        description={description}
        canonicalPath={`/catalogo/${vehicle.id}`}
        image={images[0]}
        imageAlt={`Fotografía de ${vehicleName}`}
        type="website"
      />

      <div className="border-b border-brand/10 bg-white">
        <div className="mx-auto w-full max-w-[1320px] px-4 py-4 sm:px-6">
          <Link
            className="inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.04em] text-brand hover:text-brand-deep"
            to="/catalogo"
          >
            <ArrowLeft aria-hidden="true" className="size-4" /> Volver al catálogo
          </Link>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1320px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(330px,0.65fr)] lg:py-10">
        <section aria-label={`Galería de ${vehicleName}`} className="min-w-0">
          <div className="overflow-hidden border border-brand/10 bg-white shadow-sm">
            <div className="aspect-[16/10] bg-brand/[0.05]" aria-live="polite">
              {currentImage ? (
                <button
                  type="button"
                  className="block h-full w-full cursor-zoom-in border-0 bg-transparent p-0"
                  onClick={() => setLightboxOpen(true)}
                  aria-label={`Ampliar fotografía ${selected + 1} de ${vehicleName}`}
                >
                  <img
                    src={currentImage}
                    alt={`${vehicleName}, fotografía ${selected + 1}`}
                    fetchPriority="high"
                    className="h-full w-full object-cover"
                  />
                </button>
              ) : (
                <div className="grid h-full place-items-center text-sm font-semibold text-brand-deep/70">Sin fotografía</div>
              )}
            </div>
          </div>

          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5" aria-label="Miniaturas de la galería">
              {images.slice(0, 10).map((img, index) => (
                <button
                  className={[
                    "overflow-hidden border-2 bg-white p-0 transition-colors",
                    index === selected ? "border-sun" : "border-transparent hover:border-brand/30",
                  ].join(" ")}
                  type="button"
                  key={`${img}-${index}`}
                  onClick={() => setSelection({ vehicleId: id, index })}
                  aria-label={`Mostrar fotografía ${index + 1} de ${vehicleName}`}
                  aria-pressed={index === selected}
                >
                  <img src={img} alt="" loading="lazy" decoding="async" className="aspect-[16/10] w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="self-start border border-brand/10 bg-white p-6 shadow-sm lg:sticky lg:top-[92px]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-sun px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-brand-deep">Vehículo usado</span>
              {vehicle.estado === "RESERVADO" && <StatusBadge value="RESERVADO" />}
            </div>
            <span className="text-sm font-extrabold text-brand">{vehicle.anio}</span>
          </div>

          <h1 id="vehicle-title" className="mb-0 mt-5 text-3xl font-black leading-tight tracking-[-0.04em] text-[#17191d] md:text-4xl">
            {vehicle.marca} {vehicle.modelo}
          </h1>

          <div className="mt-5">
            <strong className="block text-3xl font-black tracking-[-0.04em] text-brand-deep">
              {vehicle.precioVentaUsd
                ? formatUsd(vehicle.precioVentaUsd)
                : "Consultar precio"}
            </strong>
            {vehicle.precioVentaUsd && vehicle.precioVentaEstimado ? (
              <span className="mt-1 block text-sm font-bold text-slate-500">
                {formatUyuEquivalent(vehicle.precioVentaEstimado)}
              </span>
            ) : null}
          </div>

          <div className="mt-6 grid border-y border-brand/10 py-2 text-sm text-slate-600">
            <div className="flex items-center gap-3 py-2.5">
              <Gauge aria-hidden="true" className="size-5 text-brand" />
              <span>
                {vehicle.kilometraje !== null && vehicle.kilometraje !== undefined
                  ? `${Intl.NumberFormat("es-UY").format(vehicle.kilometraje)} km`
                  : "Kilometraje a consultar"}
              </span>
            </div>
            {vehicle.color && (
              <div className="flex items-center gap-3 py-2.5">
                <Palette aria-hidden="true" className="size-5 text-brand" />
                <span>Color: {vehicle.color}</span>
              </div>
            )}
            {vehicle.tipoVehiculo && (
              <div className="flex items-center gap-3 py-2.5">
                <CarFront aria-hidden="true" className="size-5 text-brand" />
                <span>Tipo: {vehicle.tipoVehiculoLabel ?? vehicle.tipoVehiculo}</span>
              </div>
            )}
          </div>

          {vehicle.descripcionPublica && (
            <p className="mt-5 text-sm leading-6 text-slate-600">{vehicle.descripcionPublica}</p>
          )}

          <div className="mt-6 grid gap-2.5">
            <a
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-sun px-5 font-extrabold text-brand-deep transition-colors hover:bg-[#e5c520]"
              href={`https://wa.me/${wa}?text=${encodeURIComponent(interestMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle aria-hidden="true" className="size-5" /> Consultar por WhatsApp
            </a>
            <a
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-brand/20 bg-white px-5 font-bold text-brand hover:border-brand"
              href={`tel:${phoneHref}`}
            >
              <Phone aria-hidden="true" className="size-5" /> Llamar {phoneDisplay}
            </a>
          </div>

          <small className="mt-5 block text-xs leading-5 text-slate-500">
            Confirmá con la automotora disponibilidad, precio final, documentación, condiciones de pago y garantía cuando corresponda antes de concretar la operación.
          </small>
          <Link className="mt-3 inline-block text-xs font-extrabold text-brand underline underline-offset-4" to="/informacion-legal">
            Información al consumidor
          </Link>
        </aside>
      </div>
      <ImageLightbox
        images={images.map((src, index) => ({
          src,
          alt: `${vehicleName}, fotografía ${index + 1}`,
        }))}
        index={selected}
        open={lightboxOpen}
        onIndexChange={(index) => setSelection({ vehicleId: id, index })}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
