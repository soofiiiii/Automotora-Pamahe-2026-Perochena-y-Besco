import { useEffect, useState } from "react";
import { parametroService } from "../../../services/api";
import type { Parametro } from "../../../types/domain.types";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { LoadingState } from "../../../shared/feedback/LoadingState";
import { EmptyState } from "../../../shared/feedback/EmptyState";
import { useToast } from "../../../shared/feedback/useToast";
import { errorMessage } from "../../../utils/errorMessage";

export default function ParametrosPage() {
  const [rows, setRows] = useState<Parametro[]>([]);
  const [loading, setLoading] = useState(true);
  const { show } = useToast();

  useEffect(() => {
    parametroService
      .list()
      .then(setRows)
      .catch((e) => show(errorMessage(e), "error"))
      .finally(() => setLoading(false));
  }, [show]);
  
  return (
    <>
      <PageHeader
        title="Parámetros"
        description="Consulta de configuración básica. El backend actual no ofrece altas ni modificaciones desde este endpoint."
      />
      {loading ? (
        <LoadingState />
      ) : rows.length ? (
        <div className="grid grid--3">
          {rows.map((r, i) => (
            <article className="card" key={String(r.id ?? r.clave ?? i)}>
              <small className="muted">
                {String(r.clave ?? `Parámetro ${i + 1}`)}
              </small>
              <h2>{String(r.valor ?? "—")}</h2>
              {r.descripcion && (
                <p className="muted">{String(r.descripcion)}</p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No hay parámetros para mostrar" />
      )}
    </>
  );
}
