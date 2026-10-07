import { useCallback } from "react";
import { API_URL } from "../../../config/apiConfig";
import { imagenService } from "../../../services/api";
import { evidenceUrl } from "../../../utils/evidenceUrl";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { useEffect, useState } from "react";

function PrivateEvidence({ id }: { id: number }) {
  const load = useCallback(() => imagenService.privateBlob(id), [id]);
  const { data, loading, error, retry } = useApiQuery(load);
  const [local, setLocal] = useState<{ blob: Blob; url: string }>();
  useEffect(() => {
    if (!data) return;
    const url = URL.createObjectURL(data);
    // La URL se publica asincrónicamente y se revoca al cambiar la evidencia.
    let active = true;
    queueMicrotask(() => {
      if (active) setLocal({ blob: data, url });
    });
    return () => {
      active = false;
      URL.revokeObjectURL(url);
    };
  }, [data]);
  if (loading) return <p>Cargando evidencia privada…</p>;
  if (error)
    return (
      <div role="status">
        <p>No se pudo abrir la evidencia privada.</p>
        <button
          className="button button--secondary"
          type="button"
          onClick={retry}
        >
          Reintentar
        </button>
      </div>
    );
  return local?.blob === data ? (
    <img src={local?.url} alt="Evidencia fotográfica de la refacción" />
  ) : null;
}

export function RepairEvidence({ value }: { value?: string | null }) {
  const url = evidenceUrl(value);
  let privateId: number | undefined;
  if (url) {
    const api = new URL(API_URL, window.location.origin);
    const parsed = new URL(url, window.location.origin);
    const suffix = parsed.pathname.slice(
      api.pathname.replace(/\/$/, "").length,
    );
    const match = /^\/imagenes\/(\d+)\/archivo$/.exec(suffix);
    if (
      parsed.origin === api.origin &&
      parsed.pathname.startsWith(`${api.pathname.replace(/\/$/, "")}/`) &&
      match
    )
      privateId = Number(match[1]);
  }
  return (
    <section className="repair-evidence">
      <h3>Evidencia de la refacción</h3>
      {!value ? (
        <p className="muted">
          No hay referencia fotográfica registrada para esta tarea.
        </p>
      ) : !url ? (
        <p className="muted">
          La referencia guardada no tiene un formato de enlace admitido.
        </p>
      ) : privateId ? (
        <PrivateEvidence id={privateId} />
      ) : (
        <a
          className="button button--secondary"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          referrerPolicy="no-referrer"
        >
          Abrir referencia fotográfica
        </a>
      )}
    </section>
  );
}
