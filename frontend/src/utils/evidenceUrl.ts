import { apiAssetUrl } from "../config/apiConfig";

export function evidenceUrl(value?: string | null): string {
  const raw = value?.trim();
  if (!raw || (!/^https?:\/\//i.test(raw) && !/^\/(?!\/)/.test(raw))) return "";
  const resolved = apiAssetUrl(raw);
  try {
    const parsed = new URL(resolved, "https://pamahe.invalid");
    if (parsed.username || parsed.password || !["https:", "http:"].includes(parsed.protocol)) return "";
    return resolved;
  } catch { return ""; }
}
