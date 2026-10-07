import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { solicitudVentaService } from "../../../services/api";
import { ErrorState } from "../../../shared/feedback/ErrorState";
import { LoadingState } from "../../../shared/feedback/LoadingState";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { ImageLightbox } from "../../../shared/ui/ImageLightbox";
import { useToast } from "../../../shared/feedback/useToast";
import type {
  EstadoSolicitudVenta,
  SolicitudVentaDetalle,
} from "../../../types/solicitudVenta.types";
import { errorMessage } from "../../../utils/errorMessage";
import { formatDate } from "../../../utils/formatDate";

const states: Array<{ value: EstadoSolicitudVenta; label: string }> = [
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "EN_REVISION", label: "En revisión" },
  { value: "CONTACTADA", label: "Contactada" },
  { value: "DESCARTADA", label: "Descartada" },
];

export default function SolicitudVentaDetailPage() {
  const id = Number(useParams().id);
  const validId = Number.isInteger(id) && id > 0;

  const { show } = useToast();

  const [request, setRequest] = useState<SolicitudVentaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] =
    useState<EstadoSolicitudVenta>("PENDIENTE");
  const [photoUrls, setPhotoUrls] =
    useState<Record<number, string>>({});
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!validId) {
      return;
    }

    let active = true;

    void solicitudVentaService
      .get(id)
      .then((data) => {
        if (!active) {
          return;
        }

        setRequest(data);
        setStatus(data.estado);
        setError("");
      })
      .catch((cause) => {
        if (!active) {
          return;
        }

        setError(
          errorMessage(cause, "No pudimos cargar la solicitud."),
        );
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [id, validId]);

  useEffect(() => {
    if (!request) {
      return;
    }

    let active = true;
    const created: string[] = [];

    void Promise.all(
      request.fotografias.map(async (photo) => {
        try {
          const blob = await solicitudVentaService.photo(
            request.id,
            photo.id,
          );
          if (!active) return null;
          const url = URL.createObjectURL(blob);
          created.push(url);
          return [photo.id, url] as const;
        } catch {
          return null;
        }
      }),
    ).then((entries) => {
      if (!active) return;
      setPhotoUrls(
        Object.fromEntries(
          entries.filter(
            (entry): entry is readonly [number, string] => entry !== null,
          ),
        ),
      );
    });

    return () => {
      active = false;

      created.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [request]);

  const whatsappHref = useMemo(
    () =>
      request
        ? `https://wa.me/${request.telefono.replace(/\D/g, "")}`
        : "#",
    [request],
  );

  const retryLoad = () => {
    if (!validId) {
      return;
    }

    setLoading(true);
    setError("");

    void solicitudVentaService
      .get(id)
      .then((data) => {
        setRequest(data);
        setStatus(data.estado);
      })
      .catch((cause) => {
        setError(
          errorMessage(cause, "No pudimos cargar la solicitud."),
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const updateStatus = async () => {
    setSaving(true);

    try {
      const updated = await solicitudVentaService.updateStatus(
        id,
        status,
      );

      setRequest(updated);
      show("Estado de la solicitud actualizado.", "success");
    } catch (cause) {
      show(
        errorMessage(
          cause,
          "No pudimos actualizar la solicitud.",
        ),
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!validId) {
    return (
      <ErrorState
        title="Solicitud inválida"
        description="El identificador no es válido."
      />
    );
  }

  if (loading) {
    return <LoadingState label="Cargando solicitud…" />;
  }

  if (error || !request) {
    return (
      <ErrorState
        title="No pudimos abrir la solicitud"
        description={
          error || "La solicitud no está disponible."
        }
        onRetry={retryLoad}
      />
    );
  }

  const galleryImages = request.fotografias.flatMap((photo, index) => {
    const src = photoUrls[photo.id];
    return src
      ? [{
          id: photo.id,
          src,
          alt: `Fotografía ${index + 1} de ${request.marca} ${request.modelo}`,
        }]
      : [];
  });

  return (
    <>
      <PageHeader
        title={`Solicitud #${request.id}`}
        description={`${request.marca} ${request.modelo} · recibida ${formatDate(
          request.creadaEn,
        )}`}
        actions={
          <Link
            className="button button--secondary"
            to="/app/solicitudes-venta"
          >
            Volver
          </Link>
        }
      />

      <div className="grid grid--2">
        <section className="card">
          <h2>Datos de contacto y vehículo</h2>

          <div className="detail-list">
            <Detail label="Nombre" value={request.nombre} />
            <Detail label="Teléfono" value={request.telefono} />
            <Detail
              label="Vehículo"
              value={`${request.marca} ${request.modelo}`}
            />
            <Detail label="Año" value={String(request.anio)} />
            <Detail
              label="Kilometraje"
              value={`${new Intl.NumberFormat("es-UY").format(
                request.kilometraje,
              )} km`}
            />
            <Detail
              label="Estado"
              value={
                states.find(
                  (item) => item.value === request.estado,
                )?.label ?? request.estado
              }
            />
          </div>

          {request.observaciones && (
            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {request.observaciones}
            </p>
          )}

          <div className="form-actions">
            <a
              className="button button--secondary"
              href={`tel:${request.telefono}`}
            >
              Llamar
            </a>

            <a
              className="button"
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
          </div>
        </section>

        <section className="card">
          <h2>Revisión interna</h2>

          <label className="form-field">
            <span>Estado</span>

            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value as EstadoSolicitudVenta,
                )
              }
            >
              {states.map((item) => (
                <option
                  key={item.value}
                  value={item.value}
                >
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          {request.revisadaPor && (
            <p className="muted mt-3">
              Última revisión: {request.revisadaPor}
              {request.revisadaEn
                ? ` · ${formatDate(request.revisadaEn)}`
                : ""}
            </p>
          )}

          <div className="form-actions">
            <button
              className="button"
              type="button"
              disabled={
                saving || status === request.estado
              }
              onClick={() => void updateStatus()}
            >
              {saving ? "Guardando…" : "Guardar estado"}
            </button>
          </div>
        </section>
      </div>

      <section className="card mt-5">
        <h2>Fotografías recibidas</h2>

        {request.fotografias.length ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {request.fotografias.map((photo, index) =>
              photoUrls[photo.id] ? (
                <button
                  key={photo.id}
                  type="button"
                  className="cursor-zoom-in overflow-hidden rounded-xl border border-slate-200 bg-white p-0 text-left"
                  onClick={() => {
                    const galleryIndex = galleryImages.findIndex((image) => image.id === photo.id);
                    if (galleryIndex >= 0) setLightboxIndex(galleryIndex);
                  }}
                  aria-label={`Ampliar fotografía ${index + 1} de ${request.marca} ${request.modelo}`}
                >
                  <img
                    src={photoUrls[photo.id]}
                    alt={`Fotografía ${index + 1} de ${request.marca} ${request.modelo}`}
                    className="aspect-[4/3] w-full object-cover"
                  />
                </button>
              ) : (
                <div
                  key={photo.id}
                  className="grid aspect-[4/3] place-items-center rounded-xl bg-slate-100 text-sm text-slate-500"
                >
                  Cargando fotografía…
                </div>
              ),
            )}
          </div>
        ) : (
          <p className="muted">
            No hay fotografías asociadas.
          </p>
        )}
      </section>

      <ImageLightbox
        images={galleryImages}
        index={lightboxIndex ?? 0}
        open={lightboxIndex !== null}
        onIndexChange={setLightboxIndex}
        onClose={() => setLightboxIndex(null)}
      />
    </>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="detail-item">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}