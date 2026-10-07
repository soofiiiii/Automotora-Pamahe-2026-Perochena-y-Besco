import axios from "axios";
import { API_URL } from "../config/apiConfig";
import type { PageResult } from "../types/api.types";
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
    if (
      error.response?.status === 403 &&
      error.response.data?.codigo === "PASSWORD_CHANGE_REQUIRED"
    ) {
      window.dispatchEvent(new CustomEvent("pamahe:password-required"));
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

const finiteNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

export function asPage<T>(value: unknown): PageResult<T> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("La respuesta paginada del servidor no tiene el formato esperado.");
  }

  const page = value as {
    content?: unknown;
    items?: unknown;
    number?: unknown;
    page?: unknown;
    size?: unknown;
    totalElements?: unknown;
    total?: unknown;
    totalPages?: unknown;
  };

  const content = Array.isArray(page.content)
    ? (page.content as T[])
    : Array.isArray(page.items)
      ? (page.items as T[])
      : undefined;
  const number = finiteNumber(page.number ?? page.page);
  const size = finiteNumber(page.size);
  const totalElements = finiteNumber(page.totalElements ?? page.total);
  const totalPages = finiteNumber(page.totalPages);

  if (
    !content ||
    number === undefined ||
    size === undefined ||
    totalElements === undefined ||
    totalPages === undefined ||
    number < 0 ||
    size < 1 ||
    totalElements < 0 ||
    totalPages < 0
  ) {
    throw new TypeError("La respuesta paginada del servidor no tiene el formato esperado.");
  }

  return {
    content,
    number,
    size,
    totalElements,
    totalPages,
    serverPaged: true,
  };
}
