import { spawn } from "node:child_process";
import { access, mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";

const host = "127.0.0.1";
const requests = [];

function json(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  });

  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";

    req.setEncoding("utf8");

    req.on("data", (chunk) => {
      data += chunk;
    });

    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (error) {
        reject(error);
      }
    });

    req.on("error", reject);
  });
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

async function waitFor(check, message, timeoutMs = 10_000) {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    try {
      if (await check()) {
        return;
      }
    } catch {
      // La condición puede fallar durante la navegación
      // o el arranque del proceso.
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
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(`${command} finalizó con código ${code ?? "desconocido"}.`),
      );
    });
  });
}

async function waitForChildExit(child, timeoutMs = 1_500) {
  if (!child || child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  await new Promise((resolve) => {
    let settled = false;

    const finish = () => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);

      child.off("exit", finish);
      child.off("error", finish);

      resolve();
    };

    const timeout = setTimeout(finish, timeoutMs);

    child.once("exit", finish);
    child.once("error", finish);
  });
}

async function stopChild(child, timeoutMs = 1_500) {
  if (!child || child.exitCode !== null || child.signalCode !== null) {
    return;
  }

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
    "No se encontró Chromium, Chrome o Edge. " +
      "Definí PAMAHE_BROWSER_PATH con la ruta del navegador " +
      "para ejecutar las pruebas E2E.",
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

      if (!message.id) {
        return;
      }

      const pending = this.pending.get(message.id);

      if (!pending) {
        return;
      }

      this.pending.delete(message.id);

      if (message.error) {
        pending.reject(new Error(message.error.message));
      } else {
        pending.resolve(message.result);
      }
    });
  }

  send(method, params = {}) {
    if (!this.socket) {
      throw new Error("La conexión CDP no está iniciada.");
    }

    const id = this.nextId++;

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });

      this.socket.send(
        JSON.stringify({
          id,
          method,
          params,
        }),
      );
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
    await this.send("Page.navigate", { url });

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
  return createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://${host}:${port}`);

    requests.push(`${req.method} ${url.pathname}${url.search}`);

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

    if (req.method === "POST" && url.pathname === "/api/auth/login") {
      const body = await readBody(req);

      if (body.username !== "admin" || body.password !== "pamahe-demo") {
        json(res, 401, {
          mensaje: "Credenciales inválidas",
        });

        return;
      }

      json(res, 200, {
        token: "token-e2e-con-longitud-suficiente-para-la-sesion-2026",
        username: "admin",
        nombre: "Administrador",
        roles: ["ADMINISTRADOR"],
        debeCambiarPassword: false,
      });

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

    if (
      req.method === "GET" &&
      url.pathname === "/api/catalogo/vehiculos/paginado"
    ) {
      json(res, 200, {
        content: [
          {
            id: 12,
            marca: "Toyota",
            modelo: "Corolla",
            tipoVehiculo: "AUTO",
            anio: 2022,
            color: "Blanco",
            kilometraje: 45000,
            precioVentaEstimado: 890000,
            imagenes: [],
          },
        ],
        number: Number(url.searchParams.get("page") ?? "0"),
        size: Number(url.searchParams.get("size") ?? "12"),
        totalElements: 1,
        totalPages: 1,
        first: true,
        last: true,
        empty: false,
      });

      return;
    }

    if (req.method === "GET" && url.pathname === "/api/taller/refacciones") {
      json(res, 200, [
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
          estadoTarea: url.searchParams.get("estado") || "EN_CURSO",
        },
      ]);

      return;
    }

    json(res, 404, {
      mensaje: "Ruta no simulada en la prueba E2E.",
    });
  });
}

async function main() {
  const tscCli = path.resolve("node_modules", "typescript", "bin", "tsc");

  const viteCli = path.resolve("node_modules", "vite", "bin", "vite.js");

  const apiPort = await freePort();
  const previewPort = await freePort();
  const debugPort = await freePort();

  const apiServer = mockApiServer(apiPort);
  const browserPath = await findBrowser();

  const profileDir = await mkdtemp(path.join(os.tmpdir(), "pamahe-e2e-"));

  let preview;
  let browser;
  let cdp;

  await new Promise((resolve, reject) => {
    apiServer.once("error", reject);
    apiServer.listen(apiPort, host, resolve);
  });

  try {
    await run(process.execPath, [tscCli, "-b"]);

    await run(process.execPath, [viteCli, "build"], {
      env: {
        ...process.env,
        VITE_API_URL: `http://${host}:${apiPort}/api`,
      },
    });

    preview = spawn(
      process.execPath,
      [
        viteCli,
        "preview",
        "--host",
        host,
        "--port",
        String(previewPort),
        "--strictPort",
      ],
      {
        stdio: "inherit",
      },
    );

    preview.on("error", (error) => {
      console.error("No se pudo iniciar Vite Preview:", error);
    });

    await waitFor(
      async () => (await fetch(`http://${host}:${previewPort}`)).ok,
      "El servidor de preview no inició a tiempo.",
    );

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
      {
        stdio: "ignore",
      },
    );

    let target;

    await waitFor(async () => {
      const response = await fetch(`http://${host}:${debugPort}/json/list`);

      if (!response.ok) {
        return false;
      }

      const targets = await response.json();

      target = targets.find(
        (item) => item.type === "page" && item.webSocketDebuggerUrl,
      );

      return Boolean(target);
    }, "Chromium no expuso una página para automatización.");

    cdp = new CdpClient(target.webSocketDebuggerUrl);

    await cdp.connect();

    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");

    const baseUrl = `http://${host}:${previewPort}`;

    await cdp.navigate(`${baseUrl}/app`);

    await waitFor(
      () => cdp.evaluate("location.pathname === '/login'"),
      "Una ruta privada no redirigió al acceso.",
    );

    await cdp.navigate(`${baseUrl}/catalogo`);

    try {
      await waitFor(
        () =>
          cdp.evaluate("document.body.innerText.includes('Toyota Corolla')"),
        "El catálogo público no mostró los datos simulados.",
      );
    } catch {
      const catalogDebug = await cdp.evaluate(`(() => ({
    pathname: location.pathname,
    title: document.title,
    bodyText: document.body.innerText.slice(0, 3000),
    hasToyota: document.body.innerText.includes('Toyota Corolla'),
    hasErrorState:
      document.body.innerText.includes('No pudimos') ||
      document.body.innerText.includes('Reintentar'),
    cards: [...document.querySelectorAll('article')]
      .map((element) => (element.textContent || '').trim())
      .slice(0, 10),
  }))()`);

      throw new Error(
        "El catálogo público no mostró los datos simulados.\n" +
          `Solicitudes recibidas por el mock: ${JSON.stringify(requests, null, 2)}\n` +
          `Estado de la página: ${JSON.stringify(catalogDebug, null, 2)}`,
      );
    }

    await cdp.navigate(`${baseUrl}/login`);

    await cdp.evaluate(`(() => {
      const set = (selector, value) => {
        const input =
          document.querySelector(selector);

        if (!input) {
          throw new Error(
            'Campo no encontrado: ' + selector
          );
        }

        const descriptor =
          Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            'value',
          );

        descriptor.set.call(
          input,
          value,
        );

        input.dispatchEvent(
          new Event(
            'input',
            {
              bubbles: true,
            },
          ),
        );

        input.dispatchEvent(
          new Event(
            'change',
            {
              bubbles: true,
            },
          ),
        );
      };

      set(
        'input[autocomplete="username"]',
        'admin',
      );

      set(
        'input[autocomplete="current-password"]',
        'pamahe-demo',
      );

      document
        .querySelector(
          'button[type="submit"]',
        )
        .click();
    })()`);

    await waitFor(
      () =>
        cdp.evaluate(
          "location.pathname === '/app' && " +
            "document.body.innerText.includes('Hola, Administrador')",
        ),
      "El flujo de autenticación no llegó al inicio interno.",
    );

    await cdp.navigate(`${baseUrl}/app/taller`);

    await waitFor(
      () =>
        cdp.evaluate(
          "document.body.innerText.includes(" +
            "'Cambio de aceite y filtros'" +
            ")",
        ),
      "El módulo de taller no mostró las tareas simuladas.",
    );

    await cdp.evaluate(`(() => {
      const select =
        document.querySelector(
          '.toolbar select'
        );

      if (!select) {
        throw new Error(
          'No se encontró el filtro de estado del taller.'
        );
      }

      const descriptor =
        Object.getOwnPropertyDescriptor(
          HTMLSelectElement.prototype,
          'value',
        );

      descriptor.set.call(
        select,
        'EN_CURSO',
      );

      select.dispatchEvent(
        new Event(
          'change',
          {
            bubbles: true,
          },
        ),
      );
    })()`);

    await waitFor(
      () =>
        requests.some((entry) =>
          entry.includes("GET /api/taller/refacciones?estado=EN_CURSO"),
        ),
      "El filtro del taller no generó una nueva consulta al servidor.",
    );

    console.log(
      "E2E: catálogo público, control de acceso, " +
        "autenticación y taller verificados correctamente.",
    );
  } finally {
    /*
     * Primero se intenta cerrar Chromium de forma limpia mediante CDP.
     * Esto permite que libere el lockfile del perfil temporal antes de
     * que Node intente eliminar el directorio.
     */
    if (cdp) {
      try {
        await Promise.race([
          cdp.send("Browser.close"),
          new Promise((resolve) => setTimeout(resolve, 1_000)),
        ]);
      } catch {
        // El navegador puede haber terminado antes de responder.
      }
    }

    /*
     * Se da un margen al navegador para finalizar por sí mismo.
     */
    await waitForChildExit(browser, 1_500);

    /*
     * Si Chromium continúa vivo, se fuerza su finalización.
     */
    if (browser?.exitCode === null && browser?.signalCode === null) {
      await stopChild(browser, 1_500);
    }

    cdp?.close();

    /*
     * Finaliza el servidor de Vite Preview.
     */
    await stopChild(preview, 1_500);

    /*
     * Cierra el servidor mock de la API.
     */
    await new Promise((resolve) => {
      apiServer.close(resolve);
    });

    /*
     * Intenta eliminar el perfil temporal del navegador.
     *
     * En Windows puede existir una demora breve antes de que Chromium
     * libere lockfile. Node reintenta automáticamente y, si Windows
     * continúa reteniéndolo, se informa una advertencia sin invalidar
     * una prueba E2E que funcionalmente ya terminó correctamente.
     */
    try {
      await rm(profileDir, {
        recursive: true,
        force: true,
        maxRetries: 10,
        retryDelay: 200,
      });
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error.code === "EBUSY" || error.code === "EPERM")
      ) {
        console.warn(
          "Advertencia: no se pudo eliminar inmediatamente " +
            `el perfil temporal del navegador: ${profileDir}`,
        );
      } else {
        throw error;
      }
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);

  process.exitCode = 1;
});
