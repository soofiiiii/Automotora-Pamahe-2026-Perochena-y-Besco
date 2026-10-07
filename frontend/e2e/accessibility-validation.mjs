import { spawn } from "node:child_process";

import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";

import { createServer } from "node:http";

import os from "node:os";

import path from "node:path";

const host = "127.0.0.1";

const evidenceDir = path.resolve("evidencias", "accesibilidad");

const useExistingDist =
  process.env.PAMAHE_ACCESSIBILITY_USE_EXISTING_DIST === "1";

const staticOnly =
  process.argv.includes("--static") ||
  process.env.PAMAHE_ACCESSIBILITY_STATIC_ONLY === "1";

const session = {
  token: "token-accessibility-validation-abcdefghijklmnopqrstuvwxyz",

  username: "admin",

  nombre: "Administrador",

  roles: ["ADMINISTRADOR"],

  debeCambiarPassword: false,
};

const catalogVehicle = {
  id: 12,

  marca: "Toyota",

  modelo: "Corolla",

  tipoVehiculo: "AUTO",

  anio: 2022,

  matricula: "ABC1234",

  color: "Blanco",

  kilometraje: 45000,

  estado: "DISPONIBLE",

  activo: true,

  publicado: true,

  precioVentaEstimado: 890000,

  descripcionPublica: "Sedán en excelente estado, disponible para consulta.",

  imagenes: [],

  contactoWhatsapp: "59899999999",

  contactoTelefono: "45861234",
};

const secondVehicle = {
  ...catalogVehicle,

  id: 13,

  marca: "Volkswagen",

  modelo: "T-Cross",

  tipoVehiculo: "SUV",

  anio: 2023,

  matricula: "DEF5678",

  color: "Gris",

  kilometraje: 22000,

  precioVentaEstimado: 1190000,
};

const clients = [
  {
    id: 2,

    nombre: "María",

    apellido: "Gómez",

    razonSocial: null,

    documento: "45678901",

    telefono: "099123456",

    email: "maria@example.com",

    tipoCliente: "AMBOS",

    activo: true,
  },
];

const repairs = [
  {
    id: 3,

    vehiculoId: 12,

    vehiculo: "Toyota Corolla",

    responsableOperativo: "Mecánico de turno",

    usuarioQueRegistra: "Administrador",

    fecha: "2026-09-27",

    tipoTrabajo: "MECANICA",

    descripcion: "Cambio de aceite y filtros",

    costoRepuestos: 3200,

    costoManoObra: 1800,

    costoServiciosExternos: 0,

    costoTotal: 5000,

    estadoTarea: "EN_CURSO",
  },
];

const dashboard = {
  vehiculosActivos: 12,

  vehiculosEnTaller: 3,

  vehiculosDisponibles: 6,

  vehiculosVendidos: 28,

  clientesActivos: 42,

  ventasRegistradas: 28,

  ingresosVentas: 21500000,

  rentabilidadAcumulada: 3400000,

  ventasPeriodo: 4,

  ingresosPeriodo: 3200000,

  rentabilidadPeriodo: 510000,

  inversionActualRefacciones: 245000,

  vehiculosPorEstado: { DISPONIBLE: 6, EN_TALLER: 3, COMPRADO: 3 },

  periodoDesde: null,

  periodoHasta: null,
};

const publicRoutes = [
  { name: "inicio-publico", path: "/", expectedText: "A un clic del vehículo" },

  { name: "catalogo", path: "/catalogo", expectedText: "Toyota Corolla" },

  {
    name: "detalle-catalogo",
    path: "/catalogo/12",
    expectedText: "Toyota Corolla",
  },

  { name: "acceso", path: "/login", expectedText: "Ingresar al sistema" },
];

const privateRoutes = [
  { name: "inicio-interno", path: "/app", expectedText: "Hola, Administrador" },

  {
    name: "vehiculos",
    path: "/app/vehiculos",
    expectedText: "Inventario central",
  },

  {
    name: "clientes",
    path: "/app/clientes",
    expectedText: "Compradores, vendedores",
  },

  {
    name: "taller",
    path: "/app/taller",
    expectedText: "Cambio de aceite y filtros",
  },

  {
    name: "dashboard",
    path: "/app/dashboard",
    expectedText: "Dashboard gerencial",
  },
];

function page(content) {
  return {
    content,

    number: 0,

    size: 12,

    totalElements: content.length,

    totalPages: 1,

    first: true,

    last: true,
  };
}

function json(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",

    "Access-Control-Allow-Origin": "*",

    "Access-Control-Allow-Headers": "Authorization, Content-Type",

    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  });

  res.end(JSON.stringify(body));
}

async function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();

    server.once("error", reject);

    server.listen(0, host, () => {
      const address = server.address();

      if (!address || typeof address === "string") {
        server.close();

        reject(new Error("No se pudo reservar un puerto local."));

        return;
      }

      const port = address.port;

      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

async function waitFor(check, message, timeoutMs = 12_000) {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    try {
      if (await check()) return;
    } catch {
      // La condición puede fallar mientras la página cambia de estado.
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(message);
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });

    child.once("error", reject);

    child.once("exit", (code) => {
      if (code === 0) resolve();
      else
        reject(
          new Error(`${command} finalizó con código ${code ?? "desconocido"}.`),
        );
    });
  });
}

async function stopChild(child, timeoutMs = 1500) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;

  const exited = new Promise((resolve) => {
    child.once("exit", resolve);

    child.once("error", resolve);
  });

  child.kill();

  await Promise.race([
    exited,
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}

async function findBrowser() {
  const candidates = [
    process.env.PAMAHE_BROWSER_PATH,

    process.platform === "win32" && process.env.PROGRAMFILES
      ? path.join(
          process.env.PROGRAMFILES,
          "Google",
          "Chrome",
          "Application",
          "chrome.exe",
        )
      : null,

    process.platform === "win32" && process.env["PROGRAMFILES(X86)"]
      ? path.join(
          process.env["PROGRAMFILES(X86)"],
          "Microsoft",
          "Edge",
          "Application",
          "msedge.exe",
        )
      : null,

    process.platform === "darwin"
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : null,

    process.platform === "darwin"
      ? "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
      : null,

    "/usr/bin/chromium",

    "/usr/bin/chromium-browser",

    "/usr/bin/google-chrome",

    "/usr/bin/microsoft-edge",
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      await access(candidate);

      return candidate;
    } catch {
      // Continúa con la siguiente instalación conocida.
    }
  }

  throw new Error(
    "No se encontró Chromium, Chrome o Edge. Definí PAMAHE_BROWSER_PATH con la ruta del navegador.",
  );
}

class CdpClient {
  constructor(url) {
    this.url = url;

    this.socket = null;

    this.nextId = 1;

    this.pending = new Map();
  }

  async connect() {
    this.socket = new WebSocket(this.url);

    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });

      this.socket.addEventListener("error", reject, { once: true });
    });

    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));

      if (!message.id) return;

      const pending = this.pending.get(message.id);

      if (!pending) return;

      this.pending.delete(message.id);

      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
    });
  }

  send(method, params = {}) {
    if (!this.socket)
      throw new Error("La conexión con el navegador no está iniciada.");

    const id = this.nextId++;

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });

      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const result = await this.send("Runtime.evaluate", {
      expression,

      returnByValue: true,

      awaitPromise: true,
    });

    if (result.exceptionDetails) {
      throw new Error(
        result.exceptionDetails.text ||
          "Error al evaluar JavaScript en el navegador.",
      );
    }

    return result.result?.value;
  }

  async navigate(url) {
    const navigation = await this.send("Page.navigate", { url });

    if (navigation.errorText)
      throw new Error(`No se pudo abrir ${url}: ${navigation.errorText}`);

    await waitFor(
      () => this.evaluate("document.readyState === 'complete'"),
      `La página no terminó de cargar: ${url}`,
    );
  }

  close() {
    this.socket?.close();
  }
}

function mockApiServer(port) {
  return createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://${host}:${port}`);

    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",

        "Access-Control-Allow-Headers": "Authorization, Content-Type",

        "Access-Control-Allow-Methods":
          "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      });

      res.end();

      return;
    }

    if (req.method === "GET" && url.pathname === "/api/auth/me") {
      json(res, 200, {
        username: "admin",
        nombre: "Administrador",
        roles: ["ADMINISTRADOR"],
        activo: true,
        debeCambiarPassword: false,
      });

      return;
    }

    if (req.method === "GET" && url.pathname === "/api/catalogo/vehiculos/12") {
      json(res, 200, catalogVehicle);

      return;
    }

    if (
      req.method === "GET" &&
      url.pathname === "/api/catalogo/vehiculos/paginado"
    ) {
      json(res, 200, page([catalogVehicle, secondVehicle]));
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/vehiculos") {
      json(res, 200, page([catalogVehicle, secondVehicle]));

      return;
    }

    if (req.method === "GET" && url.pathname === "/api/clientes") {
      json(res, 200, clients);

      return;
    }

    if (req.method === "GET" && url.pathname === "/api/taller/refacciones") {
      json(res, 200, repairs);

      return;
    }

    if (req.method === "GET" && url.pathname === "/api/reportes/dashboard") {
      json(res, 200, dashboard);

      return;
    }

    if (
      req.method === "GET" &&
      ["/api/compras", "/api/ventas", "/api/parametros"].includes(url.pathname)
    ) {
      json(res, 200, []);

      return;
    }

    if (req.method === "GET" && url.pathname === "/api/auditoria/paginado") {
      json(res, 200, page([]));

      return;
    }

    json(res, 404, {
      mensaje: "Ruta no simulada durante la validación de accesibilidad.",
    });
  });
}

function contentType(file) {
  if (file.endsWith(".html")) return "text/html; charset=utf-8";

  if (file.endsWith(".js")) return "application/javascript; charset=utf-8";

  if (file.endsWith(".css")) return "text/css; charset=utf-8";

  if (file.endsWith(".svg")) return "image/svg+xml";

  if (file.endsWith(".png")) return "image/png";

  if (file.endsWith(".jpg") || file.endsWith(".jpeg")) return "image/jpeg";

  if (file.endsWith(".webp")) return "image/webp";

  if (file.endsWith(".woff2")) return "font/woff2";

  if (file.endsWith(".json") || file.endsWith(".webmanifest"))
    return "application/json";

  return "application/octet-stream";
}

function staticServer(distDir) {
  return createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");

    const decoded = decodeURIComponent(url.pathname);

    let file = path.join(distDir, decoded);

    try {
      const info = await stat(file);

      if (info.isDirectory()) file = path.join(file, "index.html");

      await stat(file);
    } catch {
      file = path.join(distDir, "index.html");
    }

    try {
      const body = await readFile(file);

      res.writeHead(200, {
        "Content-Type": contentType(file),
        "Cache-Control": "no-store",
      });

      res.end(body);
    } catch {
      res.writeHead(404);

      res.end("Not found");
    }
  });
}

async function startServer(server, port) {
  await new Promise((resolve, reject) => {
    server.once("error", reject);

    server.listen(port, host, resolve);
  });
}

async function setSession(cdp, baseUrl, value) {
  await cdp.navigate(`${baseUrl}/`);

  await cdp.evaluate(
    value
      ? `sessionStorage.setItem('pamahe.auth.v1', ${JSON.stringify(JSON.stringify(value))})`
      : "sessionStorage.removeItem('pamahe.auth.v1')",
  );
}

async function waitForRoute(cdp, route) {
  await waitFor(
    () =>
      cdp.evaluate(
        `document.body.innerText.includes(${JSON.stringify(route.expectedText)})`,
      ),

    `No apareció el contenido esperado en ${route.path}: ${route.expectedText}`,
  );
}

async function auditDom(cdp) {
  return cdp.evaluate(`(() => {

    const visible = (element) => {

      const style = getComputedStyle(element);

      const rect = element.getBoundingClientRect();

      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;

    };

    const text = (element) => (element.textContent || '').replace(/\\s+/g, ' ').trim();

    const labelledBy = (element) => (element.getAttribute('aria-labelledby') || '')

      .split(/\\s+/)

      .filter(Boolean)

      .map((id) => document.getElementById(id))

      .filter(Boolean)

      .map(text)

      .join(' ')

      .trim();

    const accessibleName = (element) => {

      const aria = (element.getAttribute('aria-label') || '').trim();

      if (aria) return aria;

      const fromIds = labelledBy(element);

      if (fromIds) return fromIds;

      if ('labels' in element && element.labels?.length) {

        const labels = [...element.labels].map(text).join(' ').trim();

        if (labels) return labels;

      }

      const ownText = text(element);

      if (ownText) return ownText;

      const alt = element.querySelector?.('img[alt]')?.getAttribute('alt')?.trim();

      return alt || '';

    };



    const ids = [...document.querySelectorAll('[id]')].map((element) => element.id).filter(Boolean);

    const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];

    const fields = [...document.querySelectorAll('input:not([type="hidden"]), select, textarea')].filter(visible);

    const unlabeledFields = fields.filter((element) => !accessibleName(element)).map((element) => element.outerHTML.slice(0, 180));

    const interactive = [...document.querySelectorAll('button, a[href]')].filter(visible);

    const unnamedInteractive = interactive.filter((element) => !accessibleName(element)).map((element) => element.outerHTML.slice(0, 180));

    const imagesWithoutAlt = [...document.querySelectorAll('img:not([alt])')].filter(visible).map((element) => element.outerHTML.slice(0, 180));

    const emptyHeadings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter((element) => visible(element) && !text(element)).map((element) => element.outerHTML.slice(0, 180));

    const mains = [...document.querySelectorAll('main')].filter(visible).length;

    const h1s = [...document.querySelectorAll('h1')].filter(visible).length;

    const dialogs = [...document.querySelectorAll('[role="dialog"], dialog')].filter(visible);

    const unlabeledDialogs = dialogs.filter((element) => !accessibleName(element)).map((element) => element.outerHTML.slice(0, 180));



    return {

      lang: document.documentElement.lang,

      title: document.title,

      mains,

      h1s,

      duplicateIds,

      unlabeledFields,

      unnamedInteractive,

      imagesWithoutAlt,

      emptyHeadings,

      unlabeledDialogs,

      focusableCount: interactive.length + fields.length,

    };

  })()`);
}

function assertDom(route, result) {
  const errors = [];

  if (!result.lang) errors.push("el documento no declara idioma");

  if (!result.title.trim()) errors.push("el documento no tiene título");

  if (result.mains !== 1)
    errors.push(`se encontraron ${result.mains} elementos main visibles`);

  if (result.h1s < 1) errors.push("no se encontró encabezado h1 visible");

  if (result.duplicateIds.length)
    errors.push(`IDs duplicados: ${result.duplicateIds.join(", ")}`);

  if (result.unlabeledFields.length)
    errors.push(
      `campos sin nombre accesible: ${result.unlabeledFields.length}`,
    );

  if (result.unnamedInteractive.length)
    errors.push(
      `controles sin nombre accesible: ${result.unnamedInteractive.length}`,
    );

  if (result.imagesWithoutAlt.length)
    errors.push(`imágenes sin atributo alt: ${result.imagesWithoutAlt.length}`);

  if (result.emptyHeadings.length)
    errors.push(`encabezados vacíos: ${result.emptyHeadings.length}`);

  if (result.unlabeledDialogs.length)
    errors.push(
      `diálogos sin nombre accesible: ${result.unlabeledDialogs.length}`,
    );

  if (errors.length) throw new Error(`${route.name}: ${errors.join("; ")}.`);
}

async function pressKey(cdp, key, code, windowsVirtualKeyCode, text = "") {
  const keyDown = {
    type: text ? "keyDown" : "rawKeyDown",
    key,
    code,
    windowsVirtualKeyCode,
  };

  if (text) {
    keyDown.text = text;
    keyDown.unmodifiedText = text;
  }

  await cdp.send("Input.dispatchKeyEvent", keyDown);

  await cdp.send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key,
    code,
    windowsVirtualKeyCode,
  });

  await new Promise((resolve) => setTimeout(resolve, 100));
}

async function pressTab(cdp) {
  await pressKey(cdp, "Tab", "Tab", 9);
}

async function pressEnter(cdp) {
  await pressKey(cdp, "Enter", "Enter", 13, "\r");
}

async function pressEscape(cdp) {
  await pressKey(cdp, "Escape", "Escape", 27);
}

async function activeDescriptor(cdp) {
  return cdp.evaluate(`(() => {

    const element = document.activeElement;

    if (!element) return null;

    const labels = 'labels' in element && element.labels?.length

      ? [...element.labels].map((label) => (label.textContent || '').replace(/\\s+/g, ' ').trim()).join(' ')

      : '';

    return {

      tag: element.tagName.toLowerCase(),

      id: element.id || '',

      name: element.getAttribute('aria-label') || labels || (element.textContent || '').replace(/\\s+/g, ' ').trim(),

      type: element.getAttribute('type') || '',

      href: element.getAttribute('href') || '',

    };

  })()`);
}

async function capture(cdp, filename) {
  const screenshot = await cdp.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });

  await writeFile(
    path.join(evidenceDir, filename),
    Buffer.from(screenshot.data, "base64"),
  );
}

function channel(value) {
  const c = value / 255;

  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance([r, g, b]) {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(foreground, background) {
  const a = luminance(foreground);

  const b = luminance(background);

  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function blend(foreground, background, alpha) {
  return foreground.map((value, index) =>
    Math.round(value * alpha + background[index] * (1 - alpha)),
  );
}

function contrastAudit() {
  const white = [255, 255, 255];

  const paper = [245, 246, 248];

  const brand = [29, 50, 115];

  const brandDeep = [25, 41, 89];

  const text = [23, 25, 29];

  const muted = [104, 113, 132];

  const danger = [217, 30, 30];

  const accent = [242, 210, 46];

  const slate500 = [100, 116, 139];

  const checks = [
    ["Texto principal sobre blanco", text, white, 4.5],

    ["Texto secundario sobre fondo general", muted, paper, 4.5],

    ["Azul institucional sobre blanco", brand, white, 4.5],

    ["Blanco sobre azul profundo", white, brandDeep, 4.5],

    [
      "Texto de pie de página sobre azul profundo",
      blend(white, brandDeep, 0.65),
      brandDeep,
      4.5,
    ],

    [
      "Etiquetas del catálogo sobre fondo general",
      blend(brandDeep, paper, 0.7),
      paper,
      4.5,
    ],

    ["Placeholder del buscador sobre blanco", slate500, white, 4.5],

    ["Mensajes de error sobre fondo general", danger, paper, 4.5],

    ["Texto azul profundo sobre acento amarillo", brandDeep, accent, 4.5],
  ].map(([name, foreground, background, minimum]) => {
    const ratio = contrastRatio(foreground, background);

    return {
      name,
      ratio: Number(ratio.toFixed(2)),
      minimum,
      status: ratio >= minimum ? "OK" : "ERROR",
    };
  });

  const failed = checks.filter((entry) => entry.status !== "OK");

  if (failed.length) {
    throw new Error(
      `Contraste insuficiente: ${failed.map((entry) => `${entry.name} (${entry.ratio}:1)`).join(", ")}.`,
    );
  }

  return checks;
}

async function sourceAudit() {
  const adminLayout = await readFile(
    path.resolve("src/layouts/AdminLayout/AdminLayout.tsx"),
    "utf8",
  );

  const globalCss = await readFile(
    path.resolve("src/styles/global.css"),
    "utf8",
  );

  const catalogStyles = await readFile(
    path.resolve("src/modules/catalogo/components/catalogStyles.ts"),
    "utf8",
  );

  const publicLayout = await readFile(
    path.resolve("src/layouts/PublicLayout/PublicLayout.tsx"),
    "utf8",
  );

  const checks = [
    [
      "Salto al contenido en el sistema interno",
      adminLayout.includes('href="#contenido-principal-interno"'),
    ],

    [
      "Destino enfocable del contenido interno",
      /<main\b(?=[^>]*\bid="contenido-principal-interno")(?=[^>]*\btabIndex=\{-1\})[^>]*>/.test(
        adminLayout,
      ),
    ],

    [
      "Menú interno asociado mediante aria-controls",
      adminLayout.includes('aria-controls="admin-navigation"'),
    ],

    [
      "Foco visible global",
      globalCss.includes(":focus-visible") &&
        globalCss.includes("outline: 3px solid var(--focus-ring)"),
    ],

    [
      "Preferencia de movimiento reducido",
      globalCss.includes("@media (prefers-reduced-motion: reduce)"),
    ],

    [
      "Placeholder del catálogo con contraste reforzado",
      catalogStyles.includes("placeholder:text-brand-deep/70"),
    ],

    [
      "Texto inferior público con contraste reforzado",
      publicLayout.includes("text-xs text-white/65"),
    ],
  ].map(([name, passed]) => ({ name, status: passed ? "OK" : "ERROR" }));

  const failed = checks.filter((entry) => entry.status !== "OK");

  if (failed.length)
    throw new Error(
      `Validaciones de código fallidas: ${failed.map((entry) => entry.name).join(", ")}.`,
    );

  return checks;
}

async function keyboardAudit(cdp, baseUrl) {
  const results = [];

  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await setSession(cdp, baseUrl, null);

  await cdp.navigate(`${baseUrl}/`);

  await waitForRoute(cdp, publicRoutes[0]);

  await cdp.evaluate("document.body.focus()");

  await pressTab(cdp);

  const first = await activeDescriptor(cdp);

  if (!first?.name?.includes("Saltar al contenido"))
    throw new Error(
      "La primera tabulación pública no alcanza el enlace de salto al contenido.",
    );

  await capture(cdp, "inicio-publico-teclado.png");

  await pressEnter(cdp);

  const skipResult = await cdp.evaluate(
    "location.hash === '#contenido-principal' || document.activeElement?.id === 'contenido-principal'",
  );

  if (!skipResult)
    throw new Error(
      "El enlace de salto público no conduce al contenido principal.",
    );

  results.push({
    scenario: "Salto al contenido público",
    status: "OK",
    firstFocus: first,
  });

  await cdp.navigate(`${baseUrl}/login`);

  await waitForRoute(cdp, publicRoutes[3]);

  await cdp.evaluate("document.body.focus()");

  const loginSequence = [];

  for (let index = 0; index < 10; index += 1) {
    await pressTab(cdp);

    loginSequence.push(await activeDescriptor(cdp));
  }

  const loginText = JSON.stringify(loginSequence).toLowerCase();

  for (const expected of [
    "usuario",
    "contraseña",
    "mostrar contraseña",
    "ingresar al sistema",
  ]) {
    if (!loginText.includes(expected))
      throw new Error(
        `La navegación de acceso no alcanzó el control esperado: ${expected}.`,
      );
  }

  await capture(cdp, "acceso-teclado.png");

  results.push({
    scenario: "Recorrido de teclado en acceso",
    status: "OK",
    sequence: loginSequence,
  });

  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 360,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await cdp.navigate(`${baseUrl}/catalogo`);

  await waitForRoute(cdp, publicRoutes[1]);

  const filterButtonFocused = await cdp.evaluate(`(() => {

    const button = document.querySelector('button[aria-controls="catalog-filter-dialog"]');

    if (!(button instanceof HTMLButtonElement)) return false;

    const style = getComputedStyle(button);

    const rect = button.getBoundingClientRect();

    const visible =

      style.display !== 'none' &&

      style.visibility !== 'hidden' &&

      Number(style.opacity) !== 0 &&

      rect.width > 0 &&

      rect.height > 0;

    if (!visible) return false;

    button.focus();

    return document.activeElement === button;

  })()`);

  if (!filterButtonFocused) {
    throw new Error(
      "No se encontró o no se pudo enfocar el botón de filtros del catálogo móvil.",
    );
  }

  await pressEnter(cdp);

  try {
    await waitFor(
      () =>
        cdp.evaluate(`(() => {
        const dialog =
          document.getElementById('catalog-filter-dialog');

        const trigger =
          document.querySelector(
            'button[aria-controls="catalog-filter-dialog"]'
          );

        return (
          dialog instanceof HTMLDialogElement &&
          dialog.open &&
          trigger?.getAttribute('aria-expanded') === 'true'
        );
      })()`),
      "El panel de filtros no abrió mediante teclado.",
    );
  } catch {
    const state = await cdp.evaluate(`(() => {
    const dialog =
      document.getElementById('catalog-filter-dialog');

    const trigger =
      document.querySelector(
        'button[aria-controls="catalog-filter-dialog"]'
      );

    return {
      dialogFound: dialog instanceof HTMLDialogElement,
      dialogOpen:
        dialog instanceof HTMLDialogElement
          ? dialog.open
          : null,
      expanded:
        trigger?.getAttribute('aria-expanded') ?? null,
      activeElement:
        document.activeElement?.id ||
        document.activeElement?.tagName ||
        null,
    };
  })()`);

    throw new Error(
      `El panel de filtros no abrió mediante teclado. Estado: ${JSON.stringify(state)}`,
    );
  }

  await capture(cdp, "catalogo-filtros-teclado.png");

  await pressEscape(cdp);

  await waitFor(
    () =>
      cdp.evaluate(`(() => {

        const dialog = document.getElementById('catalog-filter-dialog');

        const trigger = document.querySelector('button[aria-controls="catalog-filter-dialog"]');

        return (

          dialog instanceof HTMLDialogElement &&

          !dialog.open &&

          trigger?.getAttribute('aria-expanded') === 'false' &&

          document.activeElement === trigger

        );

      })()`),

    "El panel de filtros no cerró correctamente con Escape o no restauró el foco.",
  );

  results.push({
    scenario: "Apertura y cierre de filtros con teclado",
    status: "OK",
  });

  await setSession(cdp, baseUrl, session);

  await cdp.navigate(`${baseUrl}/app/dashboard`);

  await waitForRoute(cdp, privateRoutes[4]);

  await cdp.evaluate("document.body.focus()");

  const internalSequence = [];

  let dashboardReached = false;
  let desdeReached = false;
  let hastaReached = false;

  for (let index = 0; index < 40; index += 1) {
    await pressTab(cdp);

    const descriptor = await activeDescriptor(cdp);
    internalSequence.push(descriptor);

    const name = descriptor?.name?.toLowerCase() ?? "";
    const href = descriptor?.href ?? "";
    const type = descriptor?.type ?? "";

    if (href === "/app/dashboard" || name.includes("dashboard")) {
      dashboardReached = true;
    }

    if (type === "date" && name.includes("desde")) {
      desdeReached = true;
    }

    if (type === "date" && name.includes("hasta")) {
      hastaReached = true;
    }

    if (dashboardReached && desdeReached && hastaReached) {
      break;
    }
  }

  if (!dashboardReached) {
    throw new Error(
      "El recorrido de teclado interno no alcanza la navegación del dashboard.",
    );
  }

  if (!desdeReached || !hastaReached) {
    const sequence = internalSequence
      .map((entry) => {
        if (!entry) return "desconocido";

        const name = entry.name || "(sin nombre)";
        const type = entry.type ? ` [${entry.type}]` : "";

        return `${entry.tag}: ${name}${type}`;
      })
      .join(" -> ");

    throw new Error(
      `El recorrido de teclado del dashboard no alcanza los filtros de período. ` +
        `Desde=${desdeReached}, Hasta=${hastaReached}. ` +
        `Secuencia: ${sequence}`,
    );
  }
  await capture(cdp, "dashboard-teclado.png");

  results.push({
    scenario: "Recorrido de teclado en gestión interna",
    status: "OK",
    sequence: internalSequence,
  });

  return results;
}

async function main() {
  await mkdir(evidenceDir, { recursive: true });

  if (staticOnly) {
    await Promise.all([
      rm(path.join(evidenceDir, "resultado-estatico.json"), {
        force: true,
      }),
      rm(path.join(evidenceDir, "validacion-estatica.log"), {
        force: true,
      }),
    ]);
  } else {
    await Promise.all([
      rm(path.join(evidenceDir, "resultado.json"), {
        force: true,
      }),
      rm(path.join(evidenceDir, "validacion-accesibilidad.log"), {
        force: true,
      }),
      rm(path.join(evidenceDir, "inicio-publico-teclado.png"), {
        force: true,
      }),
      rm(path.join(evidenceDir, "acceso-teclado.png"), {
        force: true,
      }),
      rm(path.join(evidenceDir, "catalogo-filtros-teclado.png"), {
        force: true,
      }),
      rm(path.join(evidenceDir, "dashboard-teclado.png"), {
        force: true,
      }),
    ]);
  }

  const apiPort = useExistingDist
    ? Number(process.env.PAMAHE_ACCESSIBILITY_API_PORT || "50535")
    : await freePort();

  const appPort = await freePort();

  const debugPort = await freePort();

  const distDir = path.resolve("dist");

  if (!staticOnly) {
    if (!useExistingDist) {
      const tscCli = path.resolve("node_modules", "typescript", "bin", "tsc");

      const viteCli = path.resolve("node_modules", "vite", "bin", "vite.js");

      await run(process.execPath, [tscCli, "-b"]);

      await run(process.execPath, [viteCli, "build"], {
        env: { ...process.env, VITE_API_URL: `http://${host}:${apiPort}/api` },
      });
    } else {
      await access(path.join(distDir, "index.html"));
    }
  }

  const sourceChecks = await sourceAudit();

  const contrastChecks = contrastAudit();

  if (staticOnly) {
    const logLines = [
      ...contrastChecks.map(
        (entry) => `OK | contraste | ${entry.name} | ${entry.ratio}:1`,
      ),

      ...sourceChecks.map((entry) => `OK | código | ${entry.name}`),
    ];

    const totalChecks = contrastChecks.length + sourceChecks.length;

    const summary = {
      generatedAt: new Date().toISOString(),

      mode: "static",

      standardReference:
        "WCAG 2.1 AA - validaciones básicas aplicables al alcance del proyecto",

      keyboardBrowserAuditAvailable: true,

      contrastAudits: contrastChecks,

      sourceAudits: sourceChecks,

      totalChecks,

      passed: totalChecks,

      failed: 0,
    };

    await writeFile(
      path.join(evidenceDir, "resultado-estatico.json"),
      `${JSON.stringify(summary, null, 2)}\n`,
      "utf8",
    );

    await writeFile(
      path.join(evidenceDir, "validacion-estatica.log"),

      `${logLines.join("\n")}\n\nResultado: ${summary.passed}/${summary.totalChecks} controles estáticos correctos.\n`,

      "utf8",
    );

    console.log(
      `Accesibilidad estática: ${summary.passed}/${summary.totalChecks} controles correctos.`,
    );

    console.log(`Evidencia: ${evidenceDir}`);

    return;
  }

  const apiServer = mockApiServer(apiPort);

  const appServer = staticServer(distDir);

  const browserPath = await findBrowser();

  const profileDir = await mkdtemp(
    path.join(os.tmpdir(), "pamahe-accessibility-"),
  );

  let browser;

  let cdp;

  const routeResults = [];

  const logLines = [];

  await startServer(apiServer, apiPort);

  await startServer(appServer, appPort);

  try {
    browser = spawn(
      browserPath,
      [
        "--headless=new",

        "--disable-gpu",

        "--no-sandbox",

        "--no-first-run",

        "--no-default-browser-check",

        `--remote-debugging-port=${debugPort}`,

        `--user-data-dir=${profileDir}`,

        "about:blank",
      ],
      { stdio: "ignore" },
    );

    let target;

    await waitFor(async () => {
      const response = await fetch(`http://${host}:${debugPort}/json/list`);

      if (!response.ok) return false;

      const targets = await response.json();

      target = targets.find(
        (item) => item.type === "page" && item.webSocketDebuggerUrl,
      );

      return Boolean(target);
    }, "El navegador no expuso una página para automatización.");

    cdp = new CdpClient(target.webSocketDebuggerUrl);

    await cdp.connect();

    await cdp.send("Page.enable");

    await cdp.send("Runtime.enable");

    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    const baseUrl = `http://${host}:${appPort}`;

    await setSession(cdp, baseUrl, null);

    for (const route of publicRoutes) {
      await cdp.navigate(`${baseUrl}${route.path}`);

      await waitForRoute(cdp, route);

      const result = await auditDom(cdp);

      assertDom(route, result);

      routeResults.push({
        route: route.name,
        path: route.path,
        status: "OK",
        result,
      });

      logLines.push(`OK | estructura | ${route.name} | ${route.path}`);
    }

    await setSession(cdp, baseUrl, session);

    for (const route of privateRoutes) {
      await cdp.navigate(`${baseUrl}${route.path}`);

      await waitForRoute(cdp, route);

      const result = await auditDom(cdp);

      assertDom(route, result);

      routeResults.push({
        route: route.name,
        path: route.path,
        status: "OK",
        result,
      });

      logLines.push(`OK | estructura | ${route.name} | ${route.path}`);
    }

    const keyboardResults = await keyboardAudit(cdp, baseUrl);

    for (const entry of keyboardResults)
      logLines.push(`OK | teclado | ${entry.scenario}`);

    for (const entry of contrastChecks)
      logLines.push(`OK | contraste | ${entry.name} | ${entry.ratio}:1`);

    for (const entry of sourceChecks)
      logLines.push(`OK | código | ${entry.name}`);

    const totalChecks =
      routeResults.length +
      keyboardResults.length +
      contrastChecks.length +
      sourceChecks.length;

    const summary = {
      generatedAt: new Date().toISOString(),

      standardReference:
        "WCAG 2.1 AA - validaciones básicas aplicables al alcance del proyecto",

      routeAudits: routeResults,

      keyboardAudits: keyboardResults,

      contrastAudits: contrastChecks,

      sourceAudits: sourceChecks,

      totalChecks,

      passed: totalChecks,

      failed: 0,
    };

    await writeFile(
      path.join(evidenceDir, "resultado.json"),
      `${JSON.stringify(summary, null, 2)}\n`,
      "utf8",
    );

    await writeFile(
      path.join(evidenceDir, "validacion-accesibilidad.log"),

      `${logLines.join("\n")}\n\nResultado: ${summary.passed}/${summary.totalChecks} controles correctos.\n`,

      "utf8",
    );

    console.log(
      `Accesibilidad: ${summary.passed}/${summary.totalChecks} controles correctos.`,
    );

    console.log(`Evidencia: ${evidenceDir}`);
  } finally {
    if (cdp) {
      try {
        await Promise.race([
          cdp.send("Browser.close"),
          new Promise((resolve) => setTimeout(resolve, 1000)),
        ]);
      } catch {
        // El navegador puede haberse cerrado antes de responder.
      }

      cdp.close();
    }

    await stopChild(browser);

    apiServer.close();

    appServer.close();

    await rm(profileDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);

  process.exitCode = 1;
});
