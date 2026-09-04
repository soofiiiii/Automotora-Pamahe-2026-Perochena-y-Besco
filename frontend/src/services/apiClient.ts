import axios from "axios";
import { API_URL } from "../config/apiConfig";
import { authStorage } from "./authStorage";

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
  headers: { Accept: "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = authStorage.get()?.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const body = response.data as unknown;
    if (
      body &&
      typeof body === "object" &&
      "ok" in body &&
      "data" in body &&
      response.config.responseType !== "blob"
    ) {
      response.data = (body as { data: unknown }).data;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      authStorage.clear();
      window.dispatchEvent(new CustomEvent("pamahe:unauthorized"));
    }
    return Promise.reject(error);
  },
);

export function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object") {
    const content = (value as { content?: unknown }).content;
    if (Array.isArray(content)) return content as T[];
    const items = (value as { items?: unknown }).items;
    if (Array.isArray(items)) return items as T[];
  }
  return [];
}
