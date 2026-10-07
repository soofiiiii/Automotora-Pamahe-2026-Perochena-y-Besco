import { announceQueueChange, requestBackgroundSync } from "../offline/backgroundSync";
import { registerSW } from "virtual:pwa-register";
import { initializePwaInstallPrompt } from "./installPrompt";

export const registerPwa = () => {
  initializePwaInstallPrompt();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (event: MessageEvent<unknown>) => {
      if (event.data && typeof event.data === "object" && "type" in event.data && event.data.type === "PAMAHE_QUEUE_CHANGED") announceQueueChange();
    });
  }
  return registerSW({
    immediate: true,
    onRegisteredSW: () => { void requestBackgroundSync(); },
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

};
