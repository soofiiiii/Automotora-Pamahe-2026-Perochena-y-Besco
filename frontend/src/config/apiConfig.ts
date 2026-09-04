const configuredUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

export const API_URL = (configuredUrl || "http://localhost:8080/api").replace(/\/+$/, "");

export const endpoint = (path: string) => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${normalized}`;
};

/**
 * Resuelve archivos servidos por la propia API sin permitir esquemas inseguros.
 * Acepta rutas como /api/uploads/public/x.jpg, /uploads/public/x.jpg o URLs http(s).
 */
export const apiAssetUrl = (value?: string | null) => {
  if (!value) return "";
  const raw = value.trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return "";
  return endpoint(raw.replace(/^\/api(?=\/)/, ""));
};
