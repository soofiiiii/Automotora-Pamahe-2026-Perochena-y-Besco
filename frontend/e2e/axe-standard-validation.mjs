import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  launchBrowser,
  loginUi,
  clearSession,
  setFieldByLabel,
  waitForText,
  waitFor,
  pressTab,
  pressEnter,
  pressSpace,
  pressEscape,
  screenshot,
} from "./browser-tools.mjs";

const baseUrl = (
  process.env.PAMAHE_E2E_BASE_URL || "http://127.0.0.1:15173"
).replace(/\/+$/, "");
const apiUrl = (
  process.env.PAMAHE_E2E_API_URL || "http://127.0.0.1:18080/api"
).replace(/\/+$/, "");
const cq03Evidence = path.resolve(
  process.env.PAMAHE_CQ03_EVIDENCE_DIR || "evidencia/CQ-03",
);
const evidenceDir = path.resolve(
  process.env.PAMAHE_CQ04_EVIDENCE_DIR || "evidencia/CQ-04",
);
const admin = { username: "admin", password: "AdminE2E!2026" };

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function locateAxe() {
  const explicit = process.env.PAMAHE_AXE_PATH;
  const candidates = [
    explicit,
    path.resolve("node_modules/axe-core/axe.min.js"),
    ...String(process.env.PATH || "")
      .split(path.delimiter)
      .filter(
        (entry) => entry.includes("node_modules") && entry.endsWith(".bin"),
      )
      .map((entry) => path.resolve(entry, "..", "axe-core", "axe.min.js")),
  ].filter(Boolean);
  for (const candidate of candidates)
    if (await exists(candidate)) return candidate;
  throw new Error(
    "No se encontró axe-core. Ejecutá este script mediante: npm exec --yes --package=axe-core@4.13.0 -- node e2e/axe-standard-validation.mjs",
  );
}

async function publicVehicleId() {
  const response = await fetch(
    `${apiUrl}/catalogo/vehiculos/paginado?page=0&size=10`,
  );
  if (!response.ok) {
    throw new Error(
      `No se pudo consultar catálogo público: HTTP ${response.status}`,
    );
  }
  const body = await response.json();
  const rows = body?.data?.content ?? [];
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error(
      "No existe un vehículo publicado para auditar el detalle público.",
    );
  }
  return Number(rows[0].id);
}

function safeName(value) {
  return value
    .replace(/[^a-z0-9-]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

async function auditAxe(cdp, axeSource, name, route) {
  await cdp.navigate(`${baseUrl}${route}`);
  await waitFor(
    () =>
      cdp.evaluate(
        "Boolean(document.querySelector('main, h1, form, section'))",
      ),
    `No cargó contenido auditable en ${route}`,
  );
  await cdp.evaluate(`${axeSource}\n//# sourceURL=axe-core-4.13.0.min.js`);
  const result = await cdp.evaluate(`(async () => {
    const result = await axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa'] },
      resultTypes: ['violations','passes','incomplete','inapplicable']
    });
    return {
      url: result.url,
      timestamp: result.timestamp,
      testEngine: result.testEngine,
      testEnvironment: result.testEnvironment,
      violations: result.violations.map((rule) => ({
        id: rule.id,
        impact: rule.impact,
        description: rule.description,
        help: rule.help,
        helpUrl: rule.helpUrl,
        tags: rule.tags,
        nodes: rule.nodes.map((node) => ({
          impact: node.impact,
          target: node.target,
          html: node.html,
          failureSummary: node.failureSummary,
        })),
      })),
      passes: result.passes.length,
      incomplete: result.incomplete.length,
    };
  })()`);
  const critical = result.violations.filter((rule) =>
    ["critical", "serious"].includes(rule.impact),
  );
  await writeFile(
    path.join(evidenceDir, `axe-${safeName(name)}.json`),
    `${JSON.stringify(result, null, 2)}\n`,
  );
  await screenshot(cdp, path.join(evidenceDir, `axe-${safeName(name)}.png`));
  return {
    name,
    route,
    violations: result.violations.length,
    criticalSerious: critical.length,
    critical,
  };
}

async function keyboardCatalog(cdp) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });

  await cdp.navigate(`${baseUrl}/catalogo`);
  await waitForText(cdp, "Filtros");

  await cdp.evaluate(
    "document.body.tabIndex = -1; document.body.focus();",
  );

  // 1. Tab: alcanzar el botón de filtros.
  let reached = false;

  for (let i = 0; i < 30; i += 1) {
    await pressTab(cdp);

    reached = await cdp.evaluate(
      "document.activeElement?.id === 'catalog-filter-trigger'",
    );

    if (reached) break;
  }

  if (!reached) {
    throw new Error(
      "Tab no alcanzó el botón de filtros del catálogo.",
    );
  }

  // 2. Enter: abrir el diálogo.
  await pressEnter(cdp);

  await waitFor(
    () =>
      cdp.evaluate(`(() => {
        const dialog =
          document.getElementById('catalog-filter-dialog');

        const trigger =
          document.getElementById('catalog-filter-trigger');

        return (
          dialog instanceof HTMLDialogElement &&
          dialog.open &&
          trigger?.getAttribute('aria-expanded') === 'true'
        );
      })()`),
    "Enter no abrió correctamente el diálogo de filtros.",
  );

  // 3. Escape: cerrar el diálogo.
  await pressEscape(cdp);

  await waitFor(
    () =>
      cdp.evaluate(`(() => {
        const dialog =
          document.getElementById('catalog-filter-dialog');

        const trigger =
          document.getElementById('catalog-filter-trigger');

        return (
          dialog instanceof HTMLDialogElement &&
          !dialog.open &&
          trigger?.getAttribute('aria-expanded') === 'false'
        );
      })()`),
    "Escape no cerró correctamente el diálogo de filtros.",
  );

  // 4. Comprobar retorno de foco.
  const restored = await cdp.evaluate(
    "document.activeElement?.id === 'catalog-filter-trigger'",
  );

  if (!restored) {
    throw new Error(
      "El foco no volvió al disparador de filtros después de Escape.",
    );
  }

  // 5. Shift+Tab: comprobar navegación inversa.
  await pressTab(cdp, true);

  const shiftTabMovedFocus = await cdp.evaluate(
    "document.activeElement?.id !== 'catalog-filter-trigger'",
  );

  if (!shiftTabMovedFocus) {
    throw new Error(
      "Shift+Tab no movió el foco desde el botón de filtros.",
    );
  }

  // 6. Tab: volver al botón de filtros.
  await pressTab(cdp);

  const tabReturnedToTrigger = await cdp.evaluate(
    "document.activeElement?.id === 'catalog-filter-trigger'",
  );

  if (!tabReturnedToTrigger) {
    throw new Error(
      "Tab no devolvió el foco al botón de filtros después de Shift+Tab.",
    );
  }

  // 7. Space: abrir el diálogo.
  await pressSpace(cdp);

  await waitFor(
    () =>
      cdp.evaluate(`(() => {
        const dialog =
          document.getElementById('catalog-filter-dialog');

        const trigger =
          document.getElementById('catalog-filter-trigger');

        return (
          dialog instanceof HTMLDialogElement &&
          dialog.open &&
          trigger?.getAttribute('aria-expanded') === 'true'
        );
      })()`),
    "Space no abrió correctamente el diálogo de filtros.",
  );

  // 8. Escape: cerrar nuevamente.
  await pressEscape(cdp);

  await waitFor(
    () =>
      cdp.evaluate(`(() => {
        const dialog =
          document.getElementById('catalog-filter-dialog');

        const trigger =
          document.getElementById('catalog-filter-trigger');

        return (
          dialog instanceof HTMLDialogElement &&
          !dialog.open &&
          trigger?.getAttribute('aria-expanded') === 'false' &&
          document.activeElement?.id === 'catalog-filter-trigger'
        );
      })()`),
    "Escape no cerró el diálogo o no restauró el foco después de abrirlo con Space.",
  );

  await screenshot(
    cdp,
    path.join(evidenceDir, "keyboard-catalogo-focus.png"),
  );

  return {
    name: "catalogo-filtros",
    tabReachedTrigger: true,
    enterOpenedDialog: true,
    escapeClosedDialog: true,
    focusRestored: true,
    shiftTabMovedFocus: true,
    tabReturnedToTrigger: true,
    spaceOpenedDialog: true,
    focusRestoredAfterSpace: true,
  };
}

async function keyboardInternalForm(cdp) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await clearSession(cdp);
  await loginUi(cdp, baseUrl, admin.username, admin.password);
  await cdp.navigate(`${baseUrl}/app/clientes/nuevo`);
  await waitForText(cdp, "Nuevo cliente");
  await cdp.evaluate("document.body.tabIndex = -1; document.body.focus();");
  let submitReached = false;
  for (let i = 0; i < 40; i += 1) {
    await pressTab(cdp);
    submitReached = await cdp.evaluate(`(() => {
      const el = document.activeElement;
      return el?.tagName === 'BUTTON' && (el.textContent || '').includes('Guardar cliente');
    })()`);
    if (submitReached) break;
  }
  if (!submitReached)
    throw new Error("La navegación por Tab no alcanzó Guardar cliente.");
  await pressEnter(cdp);
  await waitFor(
    () => cdp.evaluate("document.querySelectorAll('[role=alert]').length >= 2"),
    "El formulario no mostró errores accesibles al enviarse vacío.",
  );
  const alerts = await cdp.evaluate(
    "[...document.querySelectorAll('[role=alert]')].map((n) => n.textContent.trim())",
  );
  await screenshot(
    cdp,
    path.join(evidenceDir, "keyboard-formulario-errores.png"),
  );
  return {
    name: "formulario-interno",
    submitReachedByTab: true,
    submittedWithEnter: true,
    visibleAlerts: alerts,
  };
}

async function main() {
  await mkdir(evidenceDir, { recursive: true });
  const axePath = await locateAxe();
  const axeSource = await readFile(axePath, "utf8");
  const vehicleId = await publicVehicleId();
  const browser = await launchBrowser();
  const summary = {
    axeVersion: "4.13.0",
    vehicleId,
    audits: [],
    keyboard: [],
    passed: false,
  };
  try {
    const { cdp } = browser;
    summary.audits.push(await auditAxe(cdp, axeSource, "inicio", "/"));
    summary.audits.push(
      await auditAxe(cdp, axeSource, "catalogo", "/catalogo"),
    );
    summary.audits.push(
      await auditAxe(
        cdp,
        axeSource,
        "detalle-publico",
        `/catalogo/${vehicleId}`,
      ),
    );
    summary.audits.push(await auditAxe(cdp, axeSource, "login", "/login"));

    await loginUi(cdp, baseUrl, admin.username, admin.password);
    await cdp.navigate(`${baseUrl}/app/clientes/nuevo`);
    await setFieldByLabel(cdp, "Nombre", "");
    await cdp.evaluate(
      `(() => { const b=[...document.querySelectorAll('button')].find((n)=>(n.textContent||'').includes('Guardar cliente')); b?.click(); })()`,
    );
    await waitFor(
      () =>
        cdp.evaluate("document.querySelectorAll('[role=alert]').length >= 2"),
      "No aparecieron errores visibles en formulario interno.",
    );
    await cdp.evaluate(`${axeSource}\n//# sourceURL=axe-core-4.13.0.min.js`);
    const internal = await cdp.evaluate(`(async () => {
      const result = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa'] } });
      return { url: result.url, timestamp: result.timestamp, testEngine: result.testEngine, violations: result.violations.map((rule) => ({ id: rule.id, impact: rule.impact, description: rule.description, help: rule.help, helpUrl: rule.helpUrl, tags: rule.tags, nodes: rule.nodes.map((node) => ({ impact: node.impact, target: node.target, html: node.html, failureSummary: node.failureSummary })) })), passes: result.passes.length, incomplete: result.incomplete.length };
    })()`);
    await writeFile(
      path.join(evidenceDir, "axe-formulario-interno-con-errores.json"),
      `${JSON.stringify(internal, null, 2)}\n`,
    );
    await screenshot(
      cdp,
      path.join(evidenceDir, "axe-formulario-interno-con-errores.png"),
    );
    summary.audits.push({
      name: "formulario-interno-con-errores",
      route: "/app/clientes/nuevo",
      violations: internal.violations.length,
      criticalSerious: internal.violations.filter((rule) =>
        ["critical", "serious"].includes(rule.impact),
      ).length,
    });

    summary.keyboard.push(await keyboardCatalog(cdp));
    summary.keyboard.push(await keyboardInternalForm(cdp));

    const severe = summary.audits.reduce(
      (total, audit) => total + audit.criticalSerious,
      0,
    );
    summary.passed =
      severe === 0 &&
      summary.keyboard.every((item) =>
        Object.values(item).every((value) => value !== false),
      );
    summary.criticalSeriousTotal = severe;
    await writeFile(
      path.join(evidenceDir, "axe-summary.json"),
      `${JSON.stringify(summary, null, 2)}\n`,
    );
    await writeFile(
      path.join(evidenceDir, "axe-summary.log"),
      `${summary.audits.map((a) => `${a.name}: violations=${a.violations}, critical/serious=${a.criticalSerious}`).join("\n")}\nkeyboard=${summary.keyboard.length}\npassed=${summary.passed}\n`,
    );
    if (!summary.passed)
      throw new Error(
        `axe/teclado no cumple cierre: critical/serious=${severe}`,
      );
    console.log(`CQ-04 axe + teclado: PASS. Evidencia: ${evidenceDir}`);
  } finally {
    await browser.close();
  }
}

await main();
