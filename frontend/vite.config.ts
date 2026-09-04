import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: false,
      devOptions: { enabled: false },
      workbox: {
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /\/api\/catalogo\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "pamahe-catalogo-v1",
              networkTimeoutSeconds: 3,
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 },
            },
          },
          {
            urlPattern: /\/api\/uploads\/public\//,
            handler: "CacheFirst",
            options: {
              cacheName: "pamahe-public-images-v1",
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
    }),
  ],
  server: { port: 5173 },
});
