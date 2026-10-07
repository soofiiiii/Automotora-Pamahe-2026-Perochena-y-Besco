import { browser } from "k6/browser";
import { check } from "k6";
import { Counter } from "k6/metrics";
const completed = new Counter("catalogo_navegaciones_completas");
if (!__ENV.CATALOG_URL || !__ENV.READY_SELECTOR)
  throw new Error(
    "CATALOG_URL y READY_SELECTOR (contenido real del catálogo) requeridos",
  );
export const options = {
  scenarios: {
    catalogo: {
      executor: "shared-iterations",
      vus: 1,
      iterations: 10,
      options: { browser: { type: "chromium" } },
    },
  },
  thresholds: {
    browser_web_vital_lcp: ["p(95)<2000", "max>0"],
    checks: ["rate>0.99"],
    catalogo_navegaciones_completas: ["count==10"],
    iterations: ["count==10"],
  },
};
export default async function () {
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
  });
  const page = await context.newPage();
  try {
    const response = await page.goto(__ENV.CATALOG_URL, {
      waitUntil: "networkidle",
    });
    await page
      .locator(__ENV.READY_SELECTOR)
      .first()
      .waitFor({ state: "visible", timeout: 15000 });
    const valid = check(response, { "catálogo renderizado": (r) => r && r.status() === 200 });
    if (valid) completed.add(1);
    // Cerrar la página entrega la última muestra Web Vital al módulo browser.
  } finally {
    await page.close();
    await context.close();
  }
}
export function handleSummary(data) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return {
    [`${__ENV.RESULTS_DIR || '.'}/lcp-${stamp}.json`]: JSON.stringify(
      { profile: "catalogo-lcp", url: __ENV.CATALOG_URL, readySelector: __ENV.READY_SELECTOR, viewport: "1366x768", results: data },
      null,
      2,
    ),
    stdout:
      "LCP medido en Chromium. Documentar equipo/red y comprobar muestras antes de certificar.\n",
  };
}
