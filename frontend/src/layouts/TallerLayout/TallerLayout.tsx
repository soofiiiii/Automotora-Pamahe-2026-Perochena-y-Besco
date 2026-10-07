import { useEffect } from "react";
import AdminLayout from "../AdminLayout/AdminLayout";
import { tallerOfflineService } from "../../offline/tallerOfflineService";
import { requestBackgroundSync } from "../../offline/backgroundSync";
import { useAuth } from "../../hooks/useAuth";
import { WORKSHOP_ROLES, hasAnyRole } from "../../config/permissions";

export default function TallerLayout() {
  const { session } = useAuth();
  const canSync =
    Boolean(session) &&
    !session?.debeCambiarPassword &&
    hasAnyRole(session?.roles ?? [], WORKSHOP_ROLES);
  useEffect(() => {
    if (!canSync) return;
    const sync = async () => {
      try {
        await requestBackgroundSync();
        const result = await tallerOfflineService.sync();
        if (result.synced || result.failed)
          window.dispatchEvent(
            new CustomEvent("pamahe:toast", {
              detail: {
                type: result.failed ? "info" : "success",
                message: result.failed
                  ? "Hay refacciones pendientes que requieren revisión antes de enviarse."
                  : `${result.synced} ${result.synced === 1 ? "refacción sincronizada" : "refacciones sincronizadas"}.`,
              },
            }),
          );
      } catch {
        window.dispatchEvent(
          new CustomEvent("pamahe:toast", {
            detail: {
              type: "error",
              message:
                "No pudimos revisar las refacciones pendientes de este dispositivo.",
            },
          }),
        );
      }
    };
    window.addEventListener("online", sync);
    void sync();
    return () => window.removeEventListener("online", sync);
  }, [canSync, session?.username, session?.token]);
  return <AdminLayout />;
}
