import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";

export function OfflineBanner() {
  const online = useOnlineStatus();
  return online ? null : (
    <div className="offline-banner flex items-center justify-center gap-2 border-b border-amber-300/70 bg-amber-100/95 px-4 py-2.5 text-center text-sm font-bold text-amber-900 backdrop-blur">
      <WifiOff size={18} className="shrink-0" />
      Modo sin conexión. Las refacciones nuevas se guardarán en este dispositivo y se enviarán cuando vuelva la conexión.
    </div>
  );
}
