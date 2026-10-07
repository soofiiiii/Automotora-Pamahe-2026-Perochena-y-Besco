import { useState, type FormEvent } from "react";
import { Camera, CheckCircle2, Send } from "lucide-react";
import { solicitudVentaService } from "../../../services/api";
import { SeoMeta } from "../../../shared/seo/SeoMeta";
import { errorMessage } from "../../../utils/errorMessage";
import { validateVehicleImage } from "../../../utils/imageValidation";
import { MAX_VEHICLE_YEAR, MIN_VEHICLE_YEAR } from "../../../utils/vehicleYear";

const MAX_PHOTOS = 5;

export default function QuieroVenderPage() {
  const [photos, setPhotos] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [submittedId, setSubmittedId] = useState<number | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (photos.length < 1 || photos.length > MAX_PHOTOS) {
      setError("Adjuntá entre 1 y 5 fotografías del vehículo.");
      return;
    }

    const form = event.currentTarget;
    const raw = new FormData(form);
    const year = Number(raw.get("anio"));
    const mileage = Number(raw.get("kilometraje"));
    if (!Number.isInteger(year) || year < MIN_VEHICLE_YEAR || year > MAX_VEHICLE_YEAR) {
      setError(`El año debe estar entre ${MIN_VEHICLE_YEAR} y ${MAX_VEHICLE_YEAR}.`);
      return;
    }
    if (!Number.isInteger(mileage) || mileage < 0) {
      setError("El kilometraje debe ser un número entero igual o mayor que cero.");
      return;
    }

    const body = new FormData(form);
    body.delete("fotografias");
    photos.forEach((photo) => body.append("fotografias", photo));

    setSending(true);
    try {
      const response = await solicitudVentaService.createPublic(body);
      setSubmittedId(response.id);
      form.reset();
      setPhotos([]);
    } catch (cause) {
      setError(errorMessage(cause, "No pudimos enviar la solicitud. Revisá los datos e intentá nuevamente."));
    } finally {
      setSending(false);
    }
  };

  if (submittedId) {
    return (
      <section className="min-h-[70vh] bg-paper px-4 py-16 sm:px-6">
        <SeoMeta title="Solicitud recibida | Automotora Pamahe" description="Solicitud de venta de vehículo recibida por Automotora Pamahe." canonicalPath="/quiero-vender-mi-vehiculo" />
        <div className="mx-auto max-w-2xl rounded-2xl border border-brand/10 bg-white p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto size-12 text-brand" aria-hidden="true" />
          <h1 className="mt-4 text-3xl font-black tracking-[-0.03em] text-brand-deep">Recibimos tu vehículo</h1>
          <p className="mt-3 text-slate-600">
            La solicitud #{submittedId} quedó disponible para revisión interna. Pamahe podrá contactarte con los datos que ingresaste.
          </p>
          <button type="button" className="button mt-6" onClick={() => setSubmittedId(null)}>
            Enviar otro vehículo
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-paper py-12 md:py-16">
      <SeoMeta
        title="Quiero vender mi vehículo | Automotora Pamahe"
        description="Enviá los datos básicos y fotografías de tu vehículo para que Automotora Pamahe pueda revisarlo y contactarte."
        canonicalPath="/quiero-vender-mi-vehiculo"
      />
      <div className="mx-auto grid w-full max-w-[1120px] gap-8 px-4 sm:px-6 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="self-start lg:sticky lg:top-28">
          <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand">Tasación inicial</span>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-brand-deep md:text-5xl">Quiero vender mi vehículo</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
            Dejanos la información básica de la unidad y algunas fotografías. La solicitud no implica una compra automática: primero será revisada por el equipo de Pamahe.
          </p>
          <div className="mt-6 rounded-xl border border-brand/10 bg-white p-5 text-sm leading-6 text-slate-600">
            <strong className="block text-brand-deep">Qué necesitamos</strong>
            Nombre y teléfono de contacto, marca, modelo, año, kilometraje, observaciones opcionales y entre 1 y 5 fotografías.
          </div>
        </div>

        <form className="rounded-2xl border border-brand/10 bg-white p-5 shadow-sm sm:p-7" onSubmit={submit}>
          <div className="form-grid">
            <label className="field grid gap-2 text-sm font-semibold text-slate-800">
              <span>Nombre</span>
              <input name="nombre" required maxLength={120} autoComplete="name" />
            </label>
            <label className="field grid gap-2 text-sm font-semibold text-slate-800">
              <span>Teléfono</span>
              <input name="telefono" required minLength={8} maxLength={40} autoComplete="tel" inputMode="tel" pattern="\+?[0-9 ()-]{8,40}" title="Ingresá un teléfono válido de al menos 8 dígitos o caracteres permitidos." />
            </label>
            <label className="field grid gap-2 text-sm font-semibold text-slate-800">
              <span>Marca</span>
              <input name="marca" required maxLength={80} />
            </label>
            <label className="field grid gap-2 text-sm font-semibold text-slate-800">
              <span>Modelo</span>
              <input name="modelo" required maxLength={80} />
            </label>
            <label className="field grid gap-2 text-sm font-semibold text-slate-800">
              <span>Año</span>
              <input name="anio" type="number" min={MIN_VEHICLE_YEAR} max={MAX_VEHICLE_YEAR} step={1} required />
            </label>
            <label className="field grid gap-2 text-sm font-semibold text-slate-800">
              <span>Kilometraje</span>
              <input name="kilometraje" type="number" min={0} step={1} required />
            </label>
            <label className="field grid gap-2 text-sm font-semibold text-slate-800 sm:col-span-2">
              <span>Observaciones</span>
              <textarea name="observaciones" maxLength={1000} rows={5} placeholder="Estado general, versión, detalles que quieras contarnos…" />
            </label>
          </div>

          <div className="mt-6 rounded-xl border border-dashed border-brand/25 bg-brand/[0.025] p-5">
            <label className="flex cursor-pointer items-center gap-3 font-extrabold text-brand-deep">
              <span className="grid size-10 place-items-center rounded-lg bg-brand/10 text-brand"><Camera className="size-5" /></span>
              <span>
                Fotografías
                <small className="block pt-0.5 font-medium text-slate-500">1 a 5 imágenes JPG, PNG o WebP</small>
              </span>
              <input
                className="sr-only"
                name="fotografias"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                required
                onChange={(event) => {
                  const input = event.currentTarget;
                  const selected = Array.from(input.files ?? []);
                  if (selected.length > MAX_PHOTOS) {
                    setError("Podés adjuntar hasta 5 fotografías.");
                    input.value = "";
                    setPhotos([]);
                    return;
                  }
                  void Promise.all(selected.map(validateVehicleImage)).then((results) => {
                    const validationError = results.find((result) => result != null);
                    if (validationError) {
                      setError(validationError);
                      input.value = "";
                      setPhotos([]);
                      return;
                    }
                    setError("");
                    setPhotos(selected);
                  });
                }}
              />
            </label>
            {photos.length > 0 && <p className="mb-0 mt-3 text-sm text-slate-600">{photos.length} {photos.length === 1 ? "fotografía seleccionada" : "fotografías seleccionadas"}.</p>}
          </div>

          {error && <div role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{error}</div>}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-5">
            <p className="m-0 max-w-md text-xs leading-5 text-slate-500">Al enviar los datos autorizás a Pamahe a utilizarlos únicamente para revisar esta propuesta y contactarte.</p>
            <button className="button" type="submit" disabled={sending}>
              <Send className="size-4" aria-hidden="true" /> {sending ? "Enviando…" : "Enviar solicitud"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
