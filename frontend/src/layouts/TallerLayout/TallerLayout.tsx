import { useEffect } from "react";
import AdminLayout from "../AdminLayout/AdminLayout";
import { tallerOfflineService } from "../../offline/tallerOfflineService";
import { useAuth } from "../../hooks/useAuth";
import { WORKSHOP_ROLES, hasAnyRole } from "../../config/permissions";

export default function TallerLayout() {
    const { isAuthenticated, session } = useAuth();
    const canSync = hasAnyRole(session?.roles ?? [], WORKSHOP_ROLES);
    useEffect(() => {
        const sync = async () => {
            if (isAuthenticated && canSync) {
                const result = await tallerOfflineService.sync();
                if (result.synced > 0)
                    window.dispatchEvent(
                        new CustomEvent("pamahe:toast", {
                            detail: {
                                type: "success",
                                message: `${result.synced} refacción(es) sincronizada(s).`,
                            },
                        }),
                    );
            }
        };
        window.addEventListener("online", sync);
        void sync();
        return () => window.removeEventListener("online", sync);
    }, [isAuthenticated, canSync]);
    return <AdminLayout />;
}
