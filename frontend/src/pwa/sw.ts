/// <reference lib="webworker" />
import { clientsClaim } from "workbox-core";
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { NetworkFirst, CacheFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { API_URL } from "../config/apiConfig";
import { REPAIR_SYNC_TAG } from "../offline/backgroundSync";
import { syncRepairs } from "../offline/syncEngine";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
clientsClaim();
void self.skipWaiting();

const api = new URL(API_URL, self.location.origin);
const apiPath = api.pathname.replace(/\/$/, "");
registerRoute(
  new NavigationRoute(createHandlerBoundToURL("/index.html"), {
    denylist: [/^\/api(?:\/|$)/],
  }),
);
registerRoute(
  ({ url }) =>
    url.origin === api.origin &&
    url.pathname.startsWith(`${apiPath}/catalogo/`),
  new NetworkFirst({
    cacheName: "pamahe-catalogo-v1",
    networkTimeoutSeconds: 3,
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 60 * 60 }),
    ],
  }),
);
registerRoute(
  ({ url }) =>
    url.origin === api.origin &&
    url.pathname.startsWith(`${apiPath}/uploads/public/`),
  new CacheFirst({
    cacheName: "pamahe-public-images-v1",
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({
        maxEntries: 120,
        maxAgeSeconds: 60 * 60 * 24 * 7,
      }),
    ],
  }),
);

self.addEventListener("sync", (event: Event) => {
  const syncEvent = event as ExtendableEvent & { tag: string };
  if (syncEvent.tag !== REPAIR_SYNC_TAG) return;
  syncEvent.waitUntil(
    (async () => {
      const result = await syncRepairs();
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of clients)
        client.postMessage({ type: "PAMAHE_QUEUE_CHANGED" });
      // El rechazo solicita al navegador otro intento; los conflictos quedan para revisión.
      if (result.retryable)
        throw new Error("Hay refacciones pendientes de confirmación.");
    })(),
  );
});
