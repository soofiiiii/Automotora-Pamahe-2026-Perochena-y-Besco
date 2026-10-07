import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";

const host = "127.0.0.1";
const evidenceDir = path.resolve("evidencias", "seo");
const siteUrl = "https://pamahe.example";

const vehicles = [
  {
    id: 12,
    marca: "Toyota",
    modelo: "Corolla",
    tipoVehiculo: "AUTO",
    anio: 2022,
    color: "Blanco",
    kilometraje: 45000,
    precioVentaEstimado: 890000,
    descripcionPublica: "Sedán en excelente estado, disponible para consulta.",
    imagenes: ["/uploads/public/corolla.webp"],
  },
  {
    id: 13,
    marca: "Volkswagen",
    modelo: "T-Cross",
    tipoVehiculo: "SUV",
    anio: 2023,
    color: "Gris",
    kilometraje: 22000,
    precioVentaEstimado: 1190000,
    descripcionPublica: "SUV usado con información comercial actualizada.",
    imagenes: [],
  },
];

const sourceIndex = path.resolve("index.html");
const generator = path.resolve("scripts", "generate-seo.mjs");
const sourcePackage = path.resolve("package.json");
const sourceRobots = path.resolve("public", "robots.txt");

const [indexSource, packageSource] = await Promise.all([
  readFile(sourceIndex, "utf8"),
  readFile(sourcePackage, "utf8"),
]);
const packageJson = JSON.parse(packageSource);

const tempRoot = await mkdtemp(path.join(os.tmpdir(), "pamahe-seo-"));
const distDir = path.join(tempRoot, "dist");
await mkdir(distDir, { recursive: true });
await writeFile(path.join(distDir, "index.html"), indexSource, "utf8");
await writeFile(path.join(distDir, "robots.txt"), await readFile(sourceRobots, "utf8"), "utf8");

const server = createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${host}`);
  if (url.pathname === "/api/catalogo/vehiculos/paginado") {
    const page = Number(url.searchParams.get("page") || 0);
    const content = page === 0 ? [vehicles[0]] : page === 1 ? [vehicles[1]] : [];
    const body = {
      ok: true,
      mensaje: "ok",
      data: {
        content,
        number: page,
        size: 1,
        totalElements: 2,
        totalPages: 2,
      },
    };
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(body));
    return;
  }
  res.writeHead(404);
  res.end();
});

await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, host, resolve);
});

const address = server.address();
if (!address || typeof address === "string") throw new Error("No se pudo iniciar la API de prueba.");
const apiUrl = `http://${host}:${address.port}/api`;

try {
  await run(process.execPath, [generator], {
    env: {
      ...process.env,
      PAMAHE_SEO_DIST_DIR: distDir,
      PAMAHE_SEO_PAGE_SIZE: "1",
      VITE_PUBLIC_SITE_URL: siteUrl,
      VITE_API_URL: apiUrl,
    },
  });

  const [home, catalog, detail12, detail13, sitemap, robots] = await Promise.all([
    readFile(path.join(distDir, "index.html"), "utf8"),
    readFile(path.join(distDir, "catalogo", "index.html"), "utf8"),
    readFile(path.join(distDir, "catalogo", "12", "index.html"), "utf8"),
    readFile(path.join(distDir, "catalogo", "13", "index.html"), "utf8"),
    readFile(path.join(distDir, "sitemap.xml"), "utf8"),
    readFile(path.join(distDir, "robots.txt"), "utf8"),
  ]);

  const checks = [
    ["El build ejecuta la generación SEO", packageJson.scripts?.build?.includes("generate-seo.mjs") === true],
    ["Existe comando de validación SEO", typeof packageJson.scripts?.["test:seo"] === "string"],
    ["Inicio tiene title estático específico", home.includes("Automotora Pamahe | Vehículos usados en Juan Lacaze")],
    ["Inicio tiene canonical absoluto", home.includes(`rel=\"canonical\" href=\"${siteUrl}/\"`)],
    ["Catálogo tiene HTML propio", catalog.includes("Vehículos usados disponibles | Automotora Pamahe")],
    ["Catálogo tiene canonical propio", catalog.includes(`${siteUrl}/catalogo`)],
    ["Detalle 12 tiene title del vehículo", detail12.includes("Toyota Corolla 2022 | Automotora Pamahe")],
    ["Detalle 12 tiene descripción del vehículo", detail12.includes("Sedán en excelente estado")],
    ["Detalle 12 tiene Open Graph image absoluta", detail12.includes(`${apiUrl}/uploads/public/corolla.webp`)],
    ["Detalle 12 tiene JSON-LD Vehicle", detail12.includes('"@type":"Vehicle"')],
    ["Detalle 13 se genera desde la segunda página API", detail13.includes("Volkswagen T-Cross 2023")],
    ["Sitemap incluye inicio", sitemap.includes(`<loc>${siteUrl}/</loc>`)],
    ["Sitemap incluye catálogo", sitemap.includes(`<loc>${siteUrl}/catalogo</loc>`)],
    ["Sitemap incluye vehículos públicos", sitemap.includes(`${siteUrl}/catalogo/12`) && sitemap.includes(`${siteUrl}/catalogo/13`)],
    ["Sitemap no publica rutas internas", !sitemap.includes("/app") && !sitemap.includes("/login")],
    ["robots.txt publica la ubicación del sitemap", robots.includes(`Sitemap: ${siteUrl}/sitemap.xml`)],
    ["robots.txt mantiene bloqueadas rutas internas", robots.includes("Disallow: /app") && robots.includes("Disallow: /login")],
    ["Los metadatos estáticos no dependen de ejecutar React", detail12.indexOf("<meta property=\"og:title\"") < detail12.indexOf("<body")],
  ];

  const passed = checks.filter(([, ok]) => ok).length;
  const result = {
    generatedAt: new Date().toISOString(),
    passed,
    total: checks.length,
    generatedRoutes: ["/", "/catalogo", "/catalogo/12", "/catalogo/13"],
    checks: checks.map(([name, ok]) => ({ name, ok })),
  };

  await mkdir(evidenceDir, { recursive: true });
  await writeFile(path.join(evidenceDir, "resultado.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
  await writeFile(
    path.join(evidenceDir, "validacion-seo.log"),
    `${checks.map(([name, ok]) => `${ok ? "OK" : "ERROR"} - ${name}`).join("\n")}\n\nResultado: ${passed}/${checks.length} controles correctos.\n`,
    "utf8",
  );

  console.log(`SEO estático: ${passed}/${checks.length} controles correctos.`);
  if (passed !== checks.length) process.exitCode = 1;
} finally {
  await new Promise((resolve) => server.close(resolve));
  await rm(tempRoot, { recursive: true, force: true });
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} finalizó con código ${code ?? "desconocido"}.`));
    });
  });
}
