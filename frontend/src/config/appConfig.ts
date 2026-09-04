export const APP_NAME =
  (import.meta.env.VITE_APP_NAME as string | undefined)?.trim() || "Automotora Pamahe";

export const DEFAULT_WHATSAPP =
  (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined)?.trim() || "59893358826";
export const DEFAULT_PHONE =
  (import.meta.env.VITE_PHONE_NUMBER as string | undefined)?.trim() || "+59893358826";
export const DEFAULT_PHONE_DISPLAY =
  (import.meta.env.VITE_PHONE_DISPLAY as string | undefined)?.trim() || "093 358 826";
export const BUSINESS_HOURS_WEEK =
  (import.meta.env.VITE_BUSINESS_HOURS_WEEK as string | undefined)?.trim() ||
  "Lun–Vie 09:00–12:00 / 14:30–19:30";
export const BUSINESS_HOURS_SATURDAY =
  (import.meta.env.VITE_BUSINESS_HOURS_SATURDAY as string | undefined)?.trim() ||
  "Sáb 10:00–13:30";
export const BUSINESS_LOCATION =
  (import.meta.env.VITE_BUSINESS_LOCATION as string | undefined)?.trim() ||
  "Juan Lacaze, Colonia, Uruguay";
export const BUSINESS_ADDRESS =
  (import.meta.env.VITE_BUSINESS_ADDRESS as string | undefined)?.trim() || "";
export const PRIVACY_CONTACT =
  (import.meta.env.VITE_PRIVACY_CONTACT as string | undefined)?.trim() || "";

export const PAGE_SIZE = 12;
export const MAX_VEHICLE_IMAGE_BYTES = 12 * 1024 * 1024;
export const MAX_VEHICLE_IMAGE_PIXELS = 24_000_000;
export const MAX_VEHICLE_IMAGE_SIDE = 8_000;
export const ALLOWED_VEHICLE_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const idle = Number(import.meta.env.VITE_SESSION_IDLE_MINUTES ?? 30);
export const SESSION_IDLE_MINUTES = Number.isFinite(idle) && idle >= 5 ? idle : 30;
