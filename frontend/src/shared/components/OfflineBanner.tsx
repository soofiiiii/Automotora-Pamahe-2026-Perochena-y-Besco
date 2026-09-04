import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";

export function OfflineBanner() {
  const online = useOnlineStatus();
  return online ? null : (
    <div className="offline-banner">
      <WifiOff size={18} />
      Modo sin conexión. Las refacciones nuevas pueden guardarse localmente para sincronizar luego.
    </div>
  );
}
