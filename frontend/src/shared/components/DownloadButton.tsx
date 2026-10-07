import { Download } from "lucide-react";
import { useState } from "react";
import { errorMessage } from "../../utils/errorMessage";
import { useToast } from "../feedback/useToast";

export function DownloadButton({
  load,
  filename,
  label = "Descargar",
  ariaLabel,
  errorFallback = "No pudimos descargar el archivo. Intentá nuevamente.",
}: {
  load: () => Promise<Blob>;
  filename: string;
  label?: string;
  ariaLabel?: string;
  errorFallback?: string;
}) {
  const [busy, setBusy] = useState(false);
  const { show } = useToast();

  return (
    <button
      className="button button--secondary"
      type="button"
      disabled={busy}
      aria-label={ariaLabel}
      aria-busy={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const blob = await load();
          if (!blob.size) throw new Error("El archivo recibido está vacío.");

          const url = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = filename;
          anchor.style.display = "none";
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
          window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (error) {
          show(errorMessage(error, errorFallback), "error");
        } finally {
          setBusy(false);
        }
      }}
    >
      <Download size={17} aria-hidden="true" />
      {busy ? "Descargando…" : label}
    </button>
  );
}