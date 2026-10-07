import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { findBrowser } from "./browser-tools.mjs";

const baseUrl = (
  process.env.PAMAHE_E2E_BASE_URL || "http://127.0.0.1:15173"
).replace(/\/+$/, "");
const apiUrl = (
  process.env.PAMAHE_E2E_API_URL || "http://127.0.0.1:18080/api"
).replace(/\/+$/, "");
const evidenceDir = path.resolve(
  process.env.PAMAHE_CQ04_EVIDENCE_DIR || "evidencia/CQ-04",
);
const cq03Evidence = path.resolve(
  process.env.PAMAHE_CQ03_EVIDENCE_DIR || "evidencia/CQ-03",
);
const lighthouseVersion = process.env.PAMAHE_LIGHTHOUSE_VERSION || "13.5.0";

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32",
      ...options,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      process.stdout.write(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
      process.stderr.write(chunk);
    });
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0
        ? resolve({ stdout, stderr })
        : reject(new Error(`${command} terminó con ${code}.\n${stderr}`)),
    );
  });
}

async function vehicleId() {
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
      "No existe un vehículo publicado para ejecutar Lighthouse sobre el detalle.",
    );
  }

  return Number(rows[0].id);
}

async function main() {
  await mkdir(evidenceDir, { recursive: true });
  const chrome = await findBrowser();
  const id = await vehicleId();
  const routes = [
    ["inicio", "/"],
    ["catalogo", "/catalogo"],
    ["login", "/login"],
    ...(id ? [["detalle-publico", `/catalogo/${id}`]] : []),
  ];
  const summary = [];
  for (const [name, route] of routes) {
    const jsonPath = path.join(evidenceDir, `lighthouse-${name}.json`);
    const htmlPath = path.join(evidenceDir, `lighthouse-${name}.html`);
    const common = [
      `lighthouse@${lighthouseVersion}`,
      `${baseUrl}${route}`,
      "--only-categories=accessibility",
      "--chrome-flags=--headless=new --no-sandbox --disable-gpu",
      "--quiet",
    ];
    const npmExec = process.platform === "win32" ? "npx.cmd" : "npx";
    const lighthouseEnv = {
      ...process.env,
      CHROME_PATH: chrome,
    };

    await run(
      npmExec,
      [
        "--yes",
        ...common,
        "--output=json",
        `--output-path=${jsonPath}`,
      ],
      {
        env: lighthouseEnv,
      },
    );

    await run(
      npmExec,
      [
        "--yes",
        ...common,
        "--output=html",
        `--output-path=${htmlPath}`,
      ],
      {
        env: lighthouseEnv,
      },
    );
    const report = JSON.parse(await readFile(jsonPath, "utf8"));
    summary.push({
      name,
      route,
      score: report.categories?.accessibility?.score ?? null,
      lighthouseVersion: report.lighthouseVersion,
    });
  }
  await writeFile(
    path.join(evidenceDir, "lighthouse-summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
  );
  console.log(
    `Lighthouse accesibilidad generado para ${summary.length} rutas.`,
  );
}

await main();
