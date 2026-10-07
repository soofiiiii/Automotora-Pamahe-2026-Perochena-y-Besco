import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";

export const DEFAULT_HOST = "127.0.0.1";

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function freePort(host = DEFAULT_HOST) {
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

export async function waitFor(
  check,
  message,
  timeoutMs = 15_000,
  intervalMs = 120,
) {
  const started = Date.now();
  let lastError;

  while (Date.now() - started < timeoutMs) {
    try {
      if (await check()) {
        return;
      }
    } catch (error) {
      lastError = error;
    }

    await sleep(intervalMs);
  }

  throw new Error(
    lastError ? `${message} Último error: ${lastError.message}` : message,
  );
}

export async function findBrowser() {
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

    process.platform === "win32" && process.env.PROGRAMFILES
      ? path.join(
          process.env.PROGRAMFILES,
          "Microsoft",
          "Edge",
          "Application",
          "msedge.exe",
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
      // Se intenta la siguiente instalación conocida.
    }
  }

  throw new Error(
    "No se encontró Chromium, Chrome o Edge. Definí PAMAHE_BROWSER_PATH.",
  );
}

export class CdpClient {
  constructor(url) {
    this.url = url;
    this.socket = null;
    this.nextId = 1;
    this.pending = new Map();
  }

  async connect() {
    this.socket = new WebSocket(this.url);

    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, {
        once: true,
      });

      this.socket.addEventListener("error", reject, {
        once: true,
      });
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
      this.pending.set(id, {
        resolve,
        reject,
      });

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
      const description = result.exceptionDetails.exception?.description;

      throw new Error(
        description ||
          result.exceptionDetails.text ||
          "Error al evaluar JavaScript en el navegador.",
      );
    }

    return result.result?.value;
  }

  async navigate(url) {
    await this.send("Page.navigate", {
      url,
    });

    await waitFor(
      () => this.evaluate("document.readyState === 'complete'"),
      `La página no terminó de cargar: ${url}`,
    );
  }

  close() {
    this.socket?.close();
  }
}

export async function launchBrowser({
  headless = true,
  viewport = {
    width: 1440,
    height: 1000,
  },
} = {}) {
  const browserPath = await findBrowser();
  const debugPort = await freePort();

  const profileDir = await mkdtemp(path.join(os.tmpdir(), "pamahe-cq-"));

  const args = [
    headless ? "--headless=new" : "--headless=false",
    "--disable-gpu",
    "--no-sandbox",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    `--window-size=${viewport.width},${viewport.height}`,
    "about:blank",
  ];

  const browser = spawn(browserPath, args, {
    stdio: "ignore",
  });

  let target;

  await waitFor(
    async () => {
      const response = await fetch(
        `http://${DEFAULT_HOST}:${debugPort}/json/list`,
      );

      if (!response.ok) {
        return false;
      }

      const targets = await response.json();

      target = targets.find(
        (item) => item.type === "page" && item.webSocketDebuggerUrl,
      );

      return Boolean(target);
    },
    "Chromium no expuso una página para automatización.",
    20_000,
  );

  const cdp = new CdpClient(target.webSocketDebuggerUrl);

  await cdp.connect();

  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Network.enable");

  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.width < 600,
  });

  return {
    browser,
    cdp,
    profileDir,

    async close() {
      cdp.close();

      if (browser.exitCode === null && browser.signalCode === null) {
        browser.kill();

        try {
          await Promise.race([
            new Promise((resolve) => {
              browser.once("exit", resolve);
            }),
            sleep(3_000),
          ]);
        } catch {
          // La limpieza posterior reintentará
          // eliminar el perfil temporal.
        }
      }

      await rm(profileDir, {
        recursive: true,
        force: true,
        maxRetries: 10,
        retryDelay: 250,
      });
    },
  };
}

function js(value) {
  return JSON.stringify(value);
}

function fieldLookupExpression(label) {
  return `(() => {
    const normalize = (value) =>
      String(value ?? '')
        .replace(/\\s+/g, ' ')
        .trim();

    const wanted = ${js(label)};
    const labels = [
      ...document.querySelectorAll('label')
    ];

    for (const labelNode of labels) {
      const labelText = normalize(
        labelNode.textContent
      );

      if (!labelText.startsWith(wanted)) {
        continue;
      }

      const forId =
        labelNode.getAttribute('for');

      const control =
        (forId
          ? document.getElementById(forId)
          : null) ||
        labelNode.querySelector(
          'input, select, textarea'
        );

      if (control) {
        return true;
      }
    }

    const ariaControl = [
      ...document.querySelectorAll(
        'input[aria-label], select[aria-label], textarea[aria-label]'
      )
    ].find((control) =>
      normalize(
        control.getAttribute('aria-label')
      ).startsWith(wanted)
    );

    return Boolean(ariaControl);
  })()`;
}

export async function setFieldByLabel(cdp, label, value) {
  await waitFor(
    () => cdp.evaluate(fieldLookupExpression(label)),
    `No apareció el campo esperado: ${label}`,
    15_000,
    100,
  );

  return cdp.evaluate(`(() => {
    const normalize = (value) =>
      String(value ?? '')
        .replace(/\\s+/g, ' ')
        .trim();

    const wanted = ${js(label)};

    const labels = [
      ...document.querySelectorAll('label')
    ];

    let control = null;

    for (const labelNode of labels) {
      const labelText = normalize(
        labelNode.textContent
      );

      if (!labelText.startsWith(wanted)) {
        continue;
      }

      const forId =
        labelNode.getAttribute('for');

      control =
        (forId
          ? document.getElementById(forId)
          : null) ||
        labelNode.querySelector(
          'input, select, textarea'
        );

      if (control) {
        break;
      }
    }

    if (!control) {
      control = [
        ...document.querySelectorAll(
          'input[aria-label], select[aria-label], textarea[aria-label]'
        )
      ].find((candidate) =>
        normalize(
          candidate.getAttribute('aria-label')
        ).startsWith(wanted)
      );
    }

    if (!control) {
      throw new Error(
        'Control no encontrado para: ' + wanted
      );
    }

    const val = ${js(value)};

    let prototype;

    if (control instanceof HTMLInputElement) {
      prototype = HTMLInputElement.prototype;
    } else if (
      control instanceof HTMLSelectElement
    ) {
      prototype = HTMLSelectElement.prototype;
    } else if (
      control instanceof HTMLTextAreaElement
    ) {
      prototype =
        HTMLTextAreaElement.prototype;
    } else {
      throw new Error(
        'Tipo de control no soportado para: ' +
          wanted
      );
    }

    const descriptor =
      Object.getOwnPropertyDescriptor(
        prototype,
        'value'
      );

    if (!descriptor?.set) {
      throw new Error(
        'No se pudo obtener el setter del campo: ' +
          wanted
      );
    }

    descriptor.set.call(
      control,
      String(val)
    );

    control.dispatchEvent(
      new Event('input', {
        bubbles: true
      })
    );

    control.dispatchEvent(
      new Event('change', {
        bubbles: true
      })
    );

    return {
      tag: control.tagName,
      value: control.value
    };
  })()`);
}

export async function clickButton(cdp, text, timeoutMs = 15_000) {
  const expression = `(() => {
    const normalize = (value) =>
      String(value ?? '')
        .replace(/\\s+/g, ' ')
        .trim();

    const wanted = ${js(text)};

    return [
      ...document.querySelectorAll('button')
    ].some((node) => {
      const current =
        normalize(node.textContent);

      return (
        current === wanted ||
        current.includes(wanted)
      );
    });
  })()`;

  await waitFor(
    () => cdp.evaluate(expression),
    `No apareció el botón esperado: ${text}`,
    timeoutMs,
    100,
  );

  return cdp.evaluate(`(() => {
    const normalize = (value) =>
      String(value ?? '')
        .replace(/\\s+/g, ' ')
        .trim();

    const wanted = ${js(text)};

    const button = [
      ...document.querySelectorAll('button')
    ].find((node) => {
      const current =
        normalize(node.textContent);

      return (
        current === wanted ||
        current.includes(wanted)
      );
    });

    if (!button) {
      throw new Error(
        'Botón no encontrado: ' + wanted
      );
    }

    if (button.disabled) {
      throw new Error(
        'Botón deshabilitado: ' + wanted
      );
    }

    button.click();

    return normalize(
      button.textContent
    );
  })()`);
}

export async function clickLink(cdp, text, timeoutMs = 15_000) {
  const expression = `(() => {
    const normalize = (value) =>
      String(value ?? '')
        .replace(/\\s+/g, ' ')
        .trim();

    const wanted = ${js(text)};

    return [
      ...document.querySelectorAll('a')
    ].some((node) => {
      const current =
        normalize(node.textContent);

      return (
        current === wanted ||
        current.includes(wanted)
      );
    });
  })()`;

  await waitFor(
    () => cdp.evaluate(expression),
    `No apareció el enlace esperado: ${text}`,
    timeoutMs,
    100,
  );

  return cdp.evaluate(`(() => {
    const normalize = (value) =>
      String(value ?? '')
        .replace(/\\s+/g, ' ')
        .trim();

    const wanted = ${js(text)};

    const link = [
      ...document.querySelectorAll('a')
    ].find((node) => {
      const current =
        normalize(node.textContent);

      return (
        current === wanted ||
        current.includes(wanted)
      );
    });

    if (!link) {
      throw new Error(
        'Enlace no encontrado: ' + wanted
      );
    }

    link.click();

    return link.getAttribute('href');
  })()`);
}

export async function waitForText(cdp, text, timeoutMs = 15_000) {
  await waitFor(
    () => cdp.evaluate(`document.body.innerText.includes(${js(text)})`),
    `No apareció el texto esperado: ${text}`,
    timeoutMs,
  );
}

export async function waitForPath(cdp, pathname, timeoutMs = 15_000) {
  await waitFor(
    () => cdp.evaluate(`location.pathname === ${js(pathname)}`),
    `No se alcanzó la ruta ${pathname}.`,
    timeoutMs,
  );
}

export async function clearSession(cdp) {
  await cdp.evaluate(`
    sessionStorage.clear();

    localStorage.removeItem('pamahe.auth');
    localStorage.removeItem('pamahe.auth.v1');

    location.href = '/login';
  `);

  await waitForPath(cdp, "/login");
}

export async function loginUi(cdp, baseUrl, username, password) {
  await cdp.navigate(`${baseUrl}/login`);

  await setFieldByLabel(cdp, "Usuario", username);

  await setFieldByLabel(cdp, "Contraseña", password);

  await clickButton(cdp, "Ingresar al sistema");

  await waitForPath(cdp, "/app", 20_000);
}

export async function setOffline(cdp, offline = true) {
  await cdp.send('Network.enable');

  await cdp.send('Network.emulateNetworkConditions', {
    offline,
    latency: 0,
    downloadThroughput: offline ? 0 : -1,
    uploadThroughput: offline ? 0 : -1,
    connectionType: offline ? 'none' : 'wifi',
  });

  await cdp.evaluate(`(() => {
    try {
      Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        get: () => ${offline ? 'false' : 'true'},
      });
    } catch (_) {}

    try {
      window.dispatchEvent(
        new Event(${offline ? "'offline'" : "'online'"}, { bubbles: true })
      );
    } catch (_) {}
  })()`);

  await sleep(400);
}

export async function screenshot(cdp, filePath) {
  const result = await cdp.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
  });

  await writeFile(filePath, Buffer.from(result.data, "base64"));
}

export async function pressKey(cdp, key, code = key, windowsVirtualKeyCode) {
  const common = {
    key,
    code,
    windowsVirtualKeyCode,
    nativeVirtualKeyCode: windowsVirtualKeyCode,
  };

  await cdp.send("Input.dispatchKeyEvent", {
    type: "keyDown",
    ...common,
  });

  await cdp.send("Input.dispatchKeyEvent", {
    type: "keyUp",
    ...common,
  });
}

export const pressTab = (cdp, shift = false) =>
  cdp
    .send("Input.dispatchKeyEvent", {
      type: "keyDown",
      key: "Tab",
      code: "Tab",
      windowsVirtualKeyCode: 9,
      nativeVirtualKeyCode: 9,
      modifiers: shift ? 8 : 0,
    })
    .then(() =>
      cdp.send("Input.dispatchKeyEvent", {
        type: "keyUp",
        key: "Tab",
        code: "Tab",
        windowsVirtualKeyCode: 9,
        nativeVirtualKeyCode: 9,
        modifiers: shift ? 8 : 0,
      }),
    );

export async function pressEnter(cdp) {
  const key = {
    key: "Enter",
    code: "Enter",
    windowsVirtualKeyCode: 13,
    nativeVirtualKeyCode: 13,
  };

  await cdp.send("Input.dispatchKeyEvent", {
    type: "rawKeyDown",
    ...key,
  });

  await cdp.send("Input.dispatchKeyEvent", {
    type: "char",
    ...key,
    text: "\r",
    unmodifiedText: "\r",
  });

  await cdp.send("Input.dispatchKeyEvent", {
    type: "keyUp",
    ...key,
  });
}

export const pressSpace = (cdp) => pressKey(cdp, " ", "Space", 32);

export const pressEscape = (cdp) => pressKey(cdp, "Escape", "Escape", 27);
