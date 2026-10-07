import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadEnv } from "vite";

const mode =
  process.env.NODE_ENV === "development" ? "development" : "production";

const fileEnv = loadEnv(mode, process.cwd(), "");

const env = {
  ...fileEnv,
  ...process.env,
};

const distDir = path.resolve(env.PAMAHE_SEO_DIST_DIR || "dist");
const publicSiteUrl = normalizeBaseUrl(env.VITE_PUBLIC_SITE_URL || "");
const apiUrl = normalizeBaseUrl(env.VITE_API_URL || "http://localhost:8080/api",);
const appName = (env.VITE_APP_NAME || "Automotora Pamahe").trim();
const requestTimeoutMs = readPositiveInt(env.PAMAHE_SEO_TIMEOUT_MS, 5000);
const pageSize = readPositiveInt(env.PAMAHE_SEO_PAGE_SIZE, 100);

const homeMeta = {
  title: "Automotora Pamahe | Vehículos usados en Juan Lacaze",
  description:
    "Consultá vehículos usados disponibles en Automotora Pamahe, revisá sus características y contactanos directamente desde el catálogo.",
  path: "/",
  type: "website",
};

const catalogMeta = {
  title: "Vehículos usados disponibles | Automotora Pamahe",
  description:
    "Consultá el catálogo de vehículos usados disponibles de Automotora Pamahe en Juan Lacaze, con filtros por marca, modelo, tipo, año y precio.",
  path: "/catalogo",
  type: "website",
};

const templatePath = path.join(distDir, "index.html");
const template = await readFile(templatePath, "utf8");
const warnings = [];

if (!publicSiteUrl) {
  warnings.push(
    "VITE_PUBLIC_SITE_URL no está definido. Se generan páginas prerenderizadas, pero canonical, sitemap y og:url requieren una URL pública absoluta.",
  );
}

const homeHtml = injectSeo(template, homeMeta);
await writeFile(templatePath, homeHtml, "utf8");

await writeRoute("catalogo", injectSeo(template, catalogMeta));

let vehicles = [];
try {
  vehicles = await fetchCatalogVehicles();
} catch (error) {
  warnings.push(
    `No se pudo consultar el catálogo durante el build: ${messageOf(error)}`,
  );
}

for (const vehicle of vehicles) {
  const meta = vehicleMeta(vehicle);
  const structuredData = vehicleStructuredData(vehicle, meta);
  const html = injectSeo(template, meta, structuredData);
  await writeRoute(path.join("catalogo", String(vehicle.id)), html);
}

if (publicSiteUrl) {
  const urls = [
    homeMeta.path,
    catalogMeta.path,
    ...vehicles.map((vehicle) => `/catalogo/${vehicle.id}`),
  ];
  await writeFile(
    path.join(distDir, "sitemap.xml"),
    buildSitemap(urls),
    "utf8",
  );
  await updateRobots();
}

for (const warning of warnings) console.warn(`[seo] ${warning}`);
console.log(
  `[seo] Generadas ${2 + vehicles.length} páginas con metadata estática${publicSiteUrl ? ` y sitemap con ${2 + vehicles.length} URLs` : ""}.`,
);

function normalizeBaseUrl(value) {
  return value.trim().replace(/\/+$/, "");
}

function readPositiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function messageOf(error) {
  return error instanceof Error ? error.message : String(error);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeXml(value) {
  return escapeHtml(value).replaceAll("'", "&apos;");
}

function truncate(value, maxLength) {
  const normalized = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function absolutePublicUrl(routePath) {
  if (!publicSiteUrl) return "";
  const normalizedPath = routePath.startsWith("/")
    ? routePath
    : `/${routePath}`;
  return new URL(normalizedPath, `${publicSiteUrl}/`).toString();
}

function absoluteAssetUrl(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return "";
  const normalized = raw.replace(/^\/api(?=\/)/, "");
  return `${apiUrl}${normalized.startsWith("/") ? normalized : `/${normalized}`}`;
}

function removeExistingSeo(html) {
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(
      /\s*<meta\s+(?:name|property)=["'](?:description|og:[^"']+|twitter:[^"']+)["'][^>]*>/gi,
      "",
    )
    .replace(/\s*<link\s+rel=["']canonical["'][^>]*>/gi, "")
    .replace(
      /\s*<script\s+type=["']application\/ld\+json["'][^>]*data-pamahe-seo[^>]*>[\s\S]*?<\/script>/gi,
      "",
    );
}

function injectSeo(html, meta, structuredData) {
  const canonical = absolutePublicUrl(meta.path);
  const image = absoluteAssetUrl(meta.image);
  const tags = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:site_name" content="${escapeHtml(appName)}" />`,
    `<meta property="og:locale" content="es_UY" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:type" content="${escapeHtml(meta.type || "website")}" />`,
    `<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
  ];

  if (canonical) {
    tags.push(`<link rel="canonical" href="${escapeHtml(canonical)}" />`);
    tags.push(`<meta property="og:url" content="${escapeHtml(canonical)}" />`);
  }

  if (image) {
    tags.push(`<meta property="og:image" content="${escapeHtml(image)}" />`);
    tags.push(
      `<meta property="og:image:alt" content="${escapeHtml(meta.imageAlt || meta.title)}" />`,
    );
    tags.push(`<meta name="twitter:image" content="${escapeHtml(image)}" />`);
    tags.push(
      `<meta name="twitter:image:alt" content="${escapeHtml(meta.imageAlt || meta.title)}" />`,
    );
  }

  if (structuredData) {
    tags.push(
      `<script type="application/ld+json" data-pamahe-seo>${JSON.stringify(structuredData).replaceAll("<", "\\u003c")}</script>`,
    );
  }

  const clean = removeExistingSeo(html);
  return clean.replace("</head>", `    ${tags.join("\n    ")}\n  </head>`);
}

async function writeRoute(relativeRoute, html) {
  const directory = path.join(distDir, relativeRoute);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, "index.html"), html, "utf8");
}

function unwrapPayload(payload) {
  if (payload && typeof payload === "object" && "data" in payload)
    return payload.data;
  return payload;
}

function asPage(payload) {
  const value = unwrapPayload(payload);
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("El catálogo paginado no tiene el formato esperado.");
  }

  const content = Array.isArray(value.content)
    ? value.content
    : Array.isArray(value.items)
      ? value.items
      : null;
  const number = Number(value.number ?? value.page);
  const totalPages = Number(value.totalPages);

  if (
    !content ||
    !Number.isInteger(number) ||
    number < 0 ||
    !Number.isInteger(totalPages) ||
    totalPages < 0
  ) {
    throw new TypeError("El catálogo paginado no tiene el formato esperado.");
  }

  return { content, number, totalPages };
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok)
      throw new Error(`HTTP ${response.status} al consultar ${url}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchCatalogVehicles() {
  const firstUrl = new URL(`${apiUrl}/catalogo/vehiculos/paginado`);
  firstUrl.searchParams.set("page", "0");
  firstUrl.searchParams.set("size", String(pageSize));
  firstUrl.searchParams.set("sort", "id,asc");

  const first = asPage(await fetchJson(firstUrl));
  const pages = [first];
  const maxPages = Math.min(first.totalPages, 1000);

  for (let page = 1; page < maxPages; page += 1) {
    const url = new URL(firstUrl);
    url.searchParams.set("page", String(page));
    pages.push(asPage(await fetchJson(url)));
  }

  const unique = new Map();
  for (const page of pages) {
    for (const vehicle of page.content) {
      const id = Number(vehicle?.id);
      if (Number.isSafeInteger(id) && id > 0) unique.set(id, vehicle);
    }
  }
  return [...unique.values()];
}

function vehicleMeta(vehicle) {
  const name =
    `${vehicle.marca ?? "Vehículo"} ${vehicle.modelo ?? ""} ${vehicle.anio ?? ""}`
      .replace(/\s+/g, " ")
      .trim();
  const description = vehicle.descripcionPublica
    ? truncate(vehicle.descripcionPublica, 155)
    : truncate(
        `${name} usado disponible en Automotora Pamahe. Consultá precio, kilometraje, características y disponibilidad.`,
        155,
      );
  const image = Array.isArray(vehicle.imagenes)
    ? vehicle.imagenes.find(Boolean)
    : "";

  return {
    title: `${name} | Automotora Pamahe`,
    description,
    path: `/catalogo/${vehicle.id}`,
    image,
    imageAlt: `Fotografía de ${name}`,
    type: "website",
  };
}

function vehicleStructuredData(vehicle, meta) {
  const image = Array.isArray(vehicle.imagenes)
    ? vehicle.imagenes.map(absoluteAssetUrl).filter(Boolean)
    : [];
  const data = {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: meta.title.replace(` | ${appName}`, ""),
    description: meta.description,
    url: absolutePublicUrl(meta.path) || undefined,
    image: image.length ? image : undefined,
    brand: vehicle.marca
      ? { "@type": "Brand", name: String(vehicle.marca) }
      : undefined,
    model: vehicle.modelo ? String(vehicle.modelo) : undefined,
    vehicleModelDate: vehicle.anio ? String(vehicle.anio) : undefined,
    color: vehicle.color ? String(vehicle.color) : undefined,
    mileageFromOdometer:
      Number.isFinite(Number(vehicle.kilometraje)) &&
      Number(vehicle.kilometraje) >= 0
        ? {
            "@type": "QuantitativeValue",
            value: Number(vehicle.kilometraje),
            unitCode: "KMT",
          }
        : undefined,
  };
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  );
}

function buildSitemap(routes) {
  const unique = [...new Set(routes.map(absolutePublicUrl).filter(Boolean))];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${unique
    .map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`)
    .join("\n")}\n</urlset>\n`;
}

async function updateRobots() {
  const robotsPath = path.join(distDir, "robots.txt");
  let robots = "User-agent: *\nAllow: /\nDisallow: /app\nDisallow: /login\n";
  try {
    robots = await readFile(robotsPath, "utf8");
  } catch {
    // Se usa el contenido base cuando el build no copió robots.txt.
  }

  const withoutSitemap = robots
    .split(/\r?\n/)
    .filter((line) => !/^Sitemap:/i.test(line.trim()))
    .join("\n")
    .trimEnd();
  await writeFile(
    robotsPath,
    `${withoutSitemap}\nSitemap: ${publicSiteUrl}/sitemap.xml\n`,
    "utf8",
  );
}
