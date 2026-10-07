import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "../utils/errorMessage";

/** Mantiene cada respuesta ligada a su consulta e ignora respuestas tardías. */
export function useApiQuery<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    load: typeof load;
    revision: number;
    data?: T;
    error: string;
  }>();

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ load, revision, data, error: "" });
      },
      (error: unknown) => {
        if (!controller.signal.aborted) setResult({ load, revision, error: errorMessage(error, "No pudimos cargar la información. Intentá nuevamente.") });
      },
    );
    return () => controller.abort();
  }, [load, revision]);

  const retry = useCallback(() => setRevision((value) => value + 1), []);
  if (!result || result.load !== load || result.revision !== revision) {
    return { data: undefined, error: "", loading: true, retry };
  }
  return { data: result.data, error: result.error, loading: false, retry };
}
