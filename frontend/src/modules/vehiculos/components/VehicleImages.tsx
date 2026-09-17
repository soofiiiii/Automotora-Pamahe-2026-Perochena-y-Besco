import { Eye, EyeOff, Star, Trash2, Upload } from "lucide-react";
import { useEffect, useState, type ChangeEvent, type ReactNode } from "react";
import { apiAssetUrl } from "../../../config/apiConfig";
import { COMMERCIAL_ROLES, IMAGE_DELETE_ROLES, hasAnyRole } from "../../../config/permissions";
import { useAuth } from "../../../hooks/useAuth";
import { imagenService } from "../../../services/api";
import type { ImagenVehiculo } from "../../../types/domain.types";
import { useToast } from "../../../shared/feedback/useToast";
import { errorMessage } from "../../../utils/errorMessage";
import { validateVehicleImage } from "../../../utils/imageValidation";

function ImagePreview({ image }: { image: ImagenVehiculo }) {
  const [privateSrc, setPrivateSrc] = useState("");

  useEffect(() => {
    if (image.publica) return;

    let local = "";
    let cancelled = false;

    imagenService
      .privateBlob(image.id)
      .then((blob) => {
        if (cancelled) return;

        local = URL.createObjectURL(blob);
        setPrivateSrc(local);
      })
      .catch(() => {
        if (!cancelled) {
          setPrivateSrc("");
        }
      });

    return () => {
      cancelled = true;

      if (local) {
        URL.revokeObjectURL(local);
      }
    };
  }, [image.id, image.publica]);

  const src = image.publica ? apiAssetUrl(image.url) : privateSrc;

  return src ? (
    <img src={src} alt="Vehículo" />
  ) : (
    <div className="image-placeholder">Imagen privada</div>
  );
}

export default function VehicleImages({ vehicleId }: { vehicleId: number }) {
  const { session } = useAuth();
  const commercial = hasAnyRole(session?.roles ?? [], COMMERCIAL_ROLES);
  const canDeleteImage = hasAnyRole(session?.roles ?? [], IMAGE_DELETE_ROLES);
  const [images, setImages] = useState<ImagenVehiculo[]>([]);
  const { show } = useToast();

  const load = () =>
    imagenService
      .list(vehicleId)
      .then(setImages)
      .catch((e) => show(errorMessage(e), "error"));

  useEffect(() => {
    let cancelled = false;

    imagenService
      .list(vehicleId)
      .then((data) => {
        if (!cancelled) {
          setImages(data);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          show(errorMessage(error), "error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [vehicleId, show]);

  const upload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validationError = await validateVehicleImage(file);
    if (validationError) {
      show(validationError, "error");
      e.target.value = "";
      return;
    }
    try {
      await imagenService.upload(vehicleId, file);
      show("Imagen cargada como privada.", "success");
      load();
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <section className="card">
      <div className="section-title">
        <div>
          <h2>Imágenes</h2>
          <p>
            Las nuevas imágenes se cargan privadas. Un perfil comercial decide
            cuáles se muestran en el catálogo.
          </p>
        </div>
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
      </div>
      <div className="image-admin-grid">
        {images.map((img) => (
          <article className="image-admin" key={img.id}>
            <ImagePreview image={img} />
            <div>
              <StatusLine
                icon={img.publica ? <Eye /> : <EyeOff />}
                text={img.publica ? "Pública" : "Privada"}
              />
              {img.principal && <StatusLine icon={<Star />} text="Principal" />}
            </div>
            <div className="actions-row">
              {commercial && (
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={async () => {
                    try {
                      await imagenService.visibility(
                        img.id,
                        !img.publica,
                        !img.publica && images.every((i) => !i.principal),
                      );
                      load();
                    } catch (e) {
                      show(errorMessage(e), "error");
                    }
                  }}
                >
                  {img.publica ? "Ocultar" : "Publicar"}
                </button>
              )}
              {canDeleteImage && (
                <button
                  type="button"
                  className="button button--danger"
                  onClick={async () => {
                    if (!confirm("¿Eliminar esta imagen?")) return;
                    try {
                      await imagenService.remove(img.id);
                      load();
                    } catch (e) {
                      show(errorMessage(e), "error");
                    }
                  }}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
      {!images.length && (
        <p className="muted">Este vehículo todavía no tiene imágenes.</p>
      )}
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
