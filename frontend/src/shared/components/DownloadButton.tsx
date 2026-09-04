import { Download } from "lucide-react";
import { useState } from "react";
import { useToast } from "../feedback/useToast";

export function DownloadButton({
  load,
  filename,
  label = "Descargar",
}: {
  load: () => Promise<Blob>;
  filename: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const { show } = useToast();
  return (
    <button
      className="button button--secondary"
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const blob = await load();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          a.click();
          window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch {
          show("No se pudo descargar el archivo.", "error");
        } finally {
          setBusy(false);
        }
      }}
    >
      <Download size={17} />
      {busy ? "Descargando…" : label}
    </button>
  );
}