import { registerSW } from "virtual:pwa-register";

export const registerPwa = () =>
  registerSW({
    immediate: true,
    onOfflineReady: () =>
      window.dispatchEvent(
        new CustomEvent("pamahe:toast", {
          detail: {
            type: "success",
            message: "La aplicación quedó disponible para uso sin conexión.",
          },
        }),
      ),
    onNeedRefresh: () =>
      window.dispatchEvent(
        new CustomEvent("pamahe:toast", {
          detail: {
            type: "info",
            message:
              "Hay una nueva versión disponible. Recargá la página para actualizar.",
          },
        }),
      ),
  });
