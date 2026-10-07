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
const evidenceDir = path.resolve("evidencias", "responsive");
const useExistingDist = process.env.PAMAHE_RESPONSIVE_USE_EXISTING_DIST === "1";

const viewports = [
  { name: "movil-360", width: 360, height: 800 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "escritorio-1440", width: 1440, height: 900 },
];

const publicRoutes = [
  { name: "inicio-publico", path: "/", selector: "#home-search-value" },
  {
    name: "catalogo",
    path: "/catalogo",
    selector: "#catalogo-titulo",
    expectedText: "Toyota Corolla",
  },
  {
    name: "detalle-catalogo",
    path: "/catalogo/12",
    selector: "#vehicle-title",
    expectedText: "Toyota Corolla",
  },
  {
    name: "acceso",
    path: "/login",
    selector: 'input[autocomplete="username"]',
  },
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

const session = {
  token: "token-responsive-validation-abcdefghijklmnopqrstuvwxyz",
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
  {
    id: 3,
    nombre: "Carlos",
    apellido: "Pérez",
    razonSocial: null,
    documento: "33444555",
    telefono: "099987654",
    email: "carlos@example.com",
    tipoCliente: "COMPRADOR",
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
  {
    id: 4,
    vehiculoId: 13,
    vehiculo: "Volkswagen T-Cross",
    responsableOperativo: "Mecánico de turno",
    usuarioQueRegistra: "Administrador",
    fecha: "2026-09-27",
    tipoTrabajo: "MECANICA",
    descripcion: "Alineación y balanceo",
    costoRepuestos: 2400,
    costoManoObra: 1200,
    costoServiciosExternos: 0,
    costoTotal: 3600,
    estadoTarea: "PENDIENTE",
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
  vehiculosPorEstado: {
    DISPONIBLE: 6,
    EN_TALLER: 3,
    COMPRADO: 3,
  },
  periodoDesde: null,
  periodoHasta: null,
};

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
      // La página puede estar cambiando de contexto mientras navega.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(message);
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      ...options,
    });
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
    if (navigation.errorText) {
      throw new Error(`No se pudo abrir ${url}: ${navigation.errorText}`);
    }
    await waitFor(
      () => this.evaluate(`location.href.startsWith(${JSON.stringify(url)})`),
      `La navegación no llegó a ${url}.`,
    );
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

    if (req.method === "GET" && url.pathname === "/api/compras") {
      json(res, 200, []);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/ventas") {
      json(res, 200, []);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/parametros") {
      json(res, 200, []);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/auditoria/paginado") {
      json(res, 200, page([]));
      return;
    }

    json(res, 404, {
      mensaje: "Ruta no simulada durante la validación responsive.",
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
  if (route.selector) {
    await waitFor(
      () =>
        cdp.evaluate(
          `Boolean(document.querySelector(${JSON.stringify(route.selector)}))`,
        ),
      `No apareció el selector esperado en ${route.path}: ${route.selector}`,
    );
  }

  if (route.expectedText) {
    await waitFor(
      () =>
        cdp.evaluate(
          `document.body.innerText.includes(${JSON.stringify(route.expectedText)})`,
        ),
      `No apareció el contenido esperado en ${route.path}: ${route.expectedText}`,
    );
  }
}

async function inspectLayout(cdp, viewport, route) {
  return cdp.evaluate(`(() => {
    const width = window.innerWidth;
    const root = document.documentElement;
    const body = document.body;
    const rootOverflow = Math.max(root.scrollWidth, body.scrollWidth) - width;
    const isPrivate = location.pathname.startsWith('/app');
    const isPublic = !isPrivate && location.pathname !== '/login';
    const displayOf = (selector) => {
      const element = document.querySelector(selector);
      return element ? getComputedStyle(element).display : null;
    };
    const sidebar = document.querySelector("#admin-navigation");
    const sidebarRect = sidebar
      ? (() => {
          const rect = sidebar.getBoundingClientRect();

          return {
            left: rect.left,
            right: rect.right,
            width: rect.width,
          };
        })()
      : null;
    const dashboardFields = [...document.querySelectorAll('.dashboard-filter-actions, .card form .field')]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return { left: rect.left, right: rect.right, width: rect.width };
      });
    const tableWraps = [...document.querySelectorAll('.table-wrap')].map((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      overflowX: getComputedStyle(element).overflowX,
    }));

    return {
      pathname: location.pathname,
      title: document.title,
      viewportWidth: width,
      documentWidth: Math.max(root.scrollWidth, body.scrollWidth),
      horizontalOverflow: rootOverflow,
      privateRoute: isPrivate,
      publicRoute: isPublic,
      menuButtonDisplay: displayOf('button[aria-controls="admin-navigation"]'),
      publicMenuButtonDisplay: displayOf('button[aria-controls="public-navigation"]'),
      sidebarRect,
      dashboardFields,
      tableWraps,
    };
  })()`);
}

function assertLayout(result, viewport, route) {
  const errors = [];
  if (result.horizontalOverflow > 1) {
    errors.push(`desbordamiento horizontal de ${result.horizontalOverflow}px`);
  }

  if (route.path.startsWith("/app")) {
    if (viewport.width <= 860) {
      if (result.menuButtonDisplay === "none") {
        errors.push("el botón de menú interno no es visible");
      }

      if (!result.sidebarRect || result.sidebarRect.right > 1) {
        errors.push(
          "la barra lateral permanece visible en ancho reducido",
        );
      }
    } else {
      if (result.menuButtonDisplay !== "none") {
        errors.push(
          "el botón de menú interno sigue visible en escritorio",
        );
      }

      if (
        !result.sidebarRect ||
        result.sidebarRect.left < -1 ||
        result.sidebarRect.right <= 0
      ) {
        errors.push(
          "la barra lateral está desplazada en escritorio",
        );
      }
    }
  }

  if (result.publicRoute) {
    if (viewport.width < 768 && result.publicMenuButtonDisplay === "none") {
      errors.push("el botón de navegación pública no es visible");
    }
    if (viewport.width >= 768 && result.publicMenuButtonDisplay !== "none") {
      errors.push(
        "el botón de navegación pública sigue visible en tablet/escritorio",
      );
    }
  }

  if (route.name === "dashboard" && viewport.width <= 768) {
    const invalidField = result.dashboardFields.some(
      (field) => field.left < -1 || field.right > viewport.width + 1,
    );
    if (invalidField)
      errors.push("los controles de período exceden el ancho visible");
  }

  if (errors.length) {
    throw new Error(`${viewport.name} / ${route.name}: ${errors.join("; ")}.`);
  }
}

async function main() {
  await rm(evidenceDir, { recursive: true, force: true });
  await mkdir(evidenceDir, { recursive: true });

  const apiPort = useExistingDist
    ? Number(process.env.PAMAHE_RESPONSIVE_API_PORT || "50535")
    : await freePort();
  const appPort = await freePort();
  const debugPort = await freePort();
  const distDir = path.resolve("dist");

  if (!useExistingDist) {
    const tscCli = path.resolve("node_modules", "typescript", "bin", "tsc");
    const viteCli = path.resolve("node_modules", "vite", "bin", "vite.js");

    await run(process.execPath, [tscCli, "-b"]);
    await run(process.execPath, [viteCli, "build"], {
      env: {
        ...process.env,
        VITE_API_URL: `http://${host}:${apiPort}/api`,
      },
    });
  } else {
    await access(path.join(distDir, "index.html"));
  }

  const apiServer = mockApiServer(apiPort);
  const appServer = staticServer(distDir);
  const browserPath = await findBrowser();
  const profileDir = await mkdtemp(
    path.join(os.tmpdir(), "pamahe-responsive-"),
  );

  let browser;
  let cdp;
  const results = [];
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

    const baseUrl = `http://${host}:${appPort}`;

    for (const viewport of viewports) {
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 1,
        mobile: false,
      });
      if (viewport.width <= 768) {
        await cdp.send("Emulation.setTouchEmulationEnabled", {
          enabled: true,
          maxTouchPoints: 5,
        });
      } else {
        await cdp.send("Emulation.setTouchEmulationEnabled", {
          enabled: false,
        });
      }

      await setSession(cdp, baseUrl, null);
      for (const route of publicRoutes) {
        await cdp.navigate(`${baseUrl}${route.path}`);
        await waitForRoute(cdp, route);
        const result = await inspectLayout(cdp, viewport, route);
        assertLayout(result, viewport, route);

        const screenshot = await cdp.send("Page.captureScreenshot", {
          format: "png",
          captureBeyondViewport: false,
        });
        await writeFile(
          path.join(evidenceDir, `${viewport.name}-${route.name}.png`),
          Buffer.from(screenshot.data, "base64"),
        );
        results.push({ viewport, route, result, status: "OK" });
        logLines.push(`OK | ${viewport.name} | ${route.name} | ${route.path}`);
      }

      await setSession(cdp, baseUrl, session);
      for (const route of privateRoutes) {
        await cdp.navigate(`${baseUrl}${route.path}`);
        await waitForRoute(cdp, route);
        const result = await inspectLayout(cdp, viewport, route);
        assertLayout(result, viewport, route);

        const screenshot = await cdp.send("Page.captureScreenshot", {
          format: "png",
          captureBeyondViewport: false,
        });
        await writeFile(
          path.join(evidenceDir, `${viewport.name}-${route.name}.png`),
          Buffer.from(screenshot.data, "base64"),
        );
        results.push({ viewport, route, result, status: "OK" });
        logLines.push(`OK | ${viewport.name} | ${route.name} | ${route.path}`);
      }
    }

    const summary = {
      generatedAt: new Date().toISOString(),
      viewports,
      routes: [...publicRoutes, ...privateRoutes].map(({ name, path }) => ({
        name,
        path,
      })),
      checks: results.length,
      passed: results.filter((entry) => entry.status === "OK").length,
      failed: 0,
      results,
    };

    await writeFile(
      path.join(evidenceDir, "resultado.json"),
      `${JSON.stringify(summary, null, 2)}\n`,
      "utf8",
    );
    await writeFile(
      path.join(evidenceDir, "validacion-responsive.log"),
      `${logLines.join("\n")}\n\nResultado: ${summary.passed}/${summary.checks} validaciones correctas.\n`,
      "utf8",
    );

    console.log(
      `Responsive: ${summary.passed}/${summary.checks} validaciones correctas.`,
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
