import { Eye, EyeOff, Star, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useState, type ChangeEvent, type ReactNode } from "react";
import { apiAssetUrl } from "../../../config/apiConfig";
import { COMMERCIAL_ROLES, IMAGE_DELETE_ROLES, hasAnyRole } from "../../../config/permissions";
import { useAuth } from "../../../hooks/useAuth";
import { imagenService } from "../../../services/api";
import type { ImagenVehiculo } from "../../../types/domain.types";
import { useConfirmDialog } from "../../../shared/feedback/useConfirmDialog";
import { useToast } from "../../../shared/feedback/useToast";
import { ImageLightbox } from "../../../shared/ui/ImageLightbox";
import { errorMessage } from "../../../utils/errorMessage";
import { validateVehicleImage } from "../../../utils/imageValidation";

export default function VehicleImages({
  vehicleId,
  readOnly = false,
  title = "Imágenes",
}: {
  vehicleId: number;
  readOnly?: boolean;
  title?: string;
}) {
  const { session } = useAuth();
  const commercial = hasAnyRole(session?.roles ?? [], COMMERCIAL_ROLES);
  const canDeleteImage = hasAnyRole(session?.roles ?? [], IMAGE_DELETE_ROLES);
  const [images, setImages] = useState<ImagenVehiculo[]>([]);
  const [privateImageSources, setPrivateImageSources] = useState<Record<number, string>>({});
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { show } = useToast();
  const { confirm } = useConfirmDialog();

  const load = useCallback(
    () =>
      imagenService
        .list(vehicleId)
        .then(setImages)
        .catch((error) =>
          show(
            errorMessage(error, "No pudimos cargar las imágenes del vehículo."),
            "error",
          ),
        ),
    [show, vehicleId],
  );

  useEffect(() => {
    let cancelled = false;

    imagenService
      .list(vehicleId)
      .then((data) => {
        if (!cancelled) setImages(data);
      })
      .catch((error) => {
        if (!cancelled) {
          show(
            errorMessage(error, "No pudimos cargar las imágenes del vehículo."),
            "error",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [vehicleId, show]);

  useEffect(() => {
    let active = true;
    const created: string[] = [];

    void Promise.all(
      images
        .filter((image) => !image.publica)
        .map(async (image) => {
          try {
            const blob = await imagenService.privateBlob(image.id);
            if (!active) return null;

            const url = URL.createObjectURL(blob);
            created.push(url);

            return [image.id, url] as const;
          } catch {
            return null;
          }
        }),
    ).then((entries) => {
      if (!active) return;

      const privateEntries = entries.filter(
        (entry): entry is readonly [number, string] => entry !== null,
      );

      setPrivateImageSources(Object.fromEntries(privateEntries));
    });

    return () => {
      active = false;
      created.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [images]);

  const imageSources = Object.fromEntries(
    images.flatMap((image) => {
      const src = image.publica
        ? apiAssetUrl(image.url)
        : privateImageSources[image.id];

      return src ? [[image.id, src]] : [];
    }),
  );

  const galleryImages = images.flatMap((image, index) => {
    const src = imageSources[image.id];
    return src
      ? [
        {
          id: image.id,
          src,
          alt: `Fotografía ${index + 1} del vehículo`,
        },
      ]
      : [];
  });

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = await validateVehicleImage(file);
    if (validationError) {
      show(validationError, "error");
      event.target.value = "";
      return;
    }

    try {
      await imagenService.upload(vehicleId, file);
      show("Imagen cargada. Solo es visible dentro del sistema.", "success");
      await load();
    } catch (error) {
      show(errorMessage(error, "No pudimos cargar la imagen."), "error");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <section className="card">
      <div className="section-title">
        <div>
          <h2>{title}</h2>
          <p>
            {readOnly
              ? "Fotografías asociadas al vehículo. Seleccioná una imagen para verla en tamaño completo."
              : "Las nuevas imágenes se cargan privadas. Un perfil comercial decide cuáles se muestran en el catálogo."}
          </p>
        </div>
        {!readOnly && (
          <label className="button button--secondary">
            <Upload size={17} />
            Cargar
            <input
              hidden
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={upload}
            />
          </label>
        )}
      </div>

      <div className="image-admin-grid">
        {images.map((image, index) => {
          const src = imageSources[image.id];
          const galleryIndex = galleryImages.findIndex((entry) => entry.id === image.id);

          return (
            <article className="image-admin" key={image.id}>
              {src ? (
                <button
                  type="button"
                  className="block w-full cursor-zoom-in border-0 bg-transparent p-0"
                  onClick={() => {
                    if (galleryIndex >= 0) setLightboxIndex(galleryIndex);
                  }}
                  aria-label={`Ampliar fotografía ${index + 1} del vehículo`}
                >
                  <img src={src} alt={`Fotografía ${index + 1} del vehículo`} />
                </button>
              ) : (
                <div className="image-placeholder">Cargando imagen…</div>
              )}

              <div>
                <StatusLine
                  icon={image.publica ? <Eye /> : <EyeOff />}
                  text={image.publica ? "Pública" : "Privada"}
                />
                {image.principal && <StatusLine icon={<Star />} text="Principal" />}
              </div>

              <div className="actions-row">
                {!readOnly && commercial && (
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={async () => {
                      try {
                        const willPublish = !image.publica;
                        await imagenService.visibility(
                          image.id,
                          willPublish,
                          willPublish && images.every((current) => !current.principal),
                        );
                        show(
                          willPublish
                            ? "Imagen publicada en el catálogo."
                            : "Imagen ocultada del catálogo.",
                          "success",
                        );
                        await load();
                      } catch (error) {
                        show(
                          errorMessage(error, "No pudimos actualizar la imagen."),
                          "error",
                        );
                      }
                    }}
                  >
                    {image.publica ? "Ocultar" : "Publicar"}
                  </button>
                )}

                {!readOnly && canDeleteImage && (
                  <button
                    type="button"
                    className="button button--danger"
                    aria-label={`Eliminar fotografía ${index + 1}`}
                    onClick={async () => {
                      const accepted = await confirm({
                        title: "Eliminar imagen",
                        message:
                          "La fotografía se eliminará del vehículo y dejará de estar disponible también en el catálogo si era pública.",
                        confirmLabel: "Continuar con la eliminación",
                        secondConfirmLabel: "Sí, eliminar imagen",
                      });
                      if (!accepted) return;

                      try {
                        await imagenService.remove(image.id);
                        setLightboxIndex(null);
                        show("Imagen eliminada correctamente.", "success");
                        await load();
                      } catch (error) {
                        show(
                          errorMessage(error, "No pudimos eliminar la imagen."),
                          "error",
                        );
                      }
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {!images.length && (
        <p className="muted">Este vehículo todavía no tiene imágenes.</p>
      )}

      <ImageLightbox
        images={galleryImages}
        index={lightboxIndex ?? 0}
        open={lightboxIndex !== null}
        onIndexChange={setLightboxIndex}
        onClose={() => setLightboxIndex(null)}
      />
    </section>
  );
}

function StatusLine({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <span className="image-status">
      {icon}
      {text}
    </span>
  );
}
