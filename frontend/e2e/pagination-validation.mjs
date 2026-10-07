import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();

const evidenceDir = path.resolve(
  projectRoot,
  "evidencias",
  "paginacion-server-side",
);

const files = {
  api: path.resolve(
    projectRoot,
    "src",
    "services",
    "api.ts",
  ),

  apiClient: path.resolve(
    projectRoot,
    "src",
    "services",
    "apiClient.ts",
  ),

  clientesPage: path.resolve(
    projectRoot,
    "src",
    "modules",
    "clientes",
    "pages",
    "ClientesPage.tsx",
  ),

  catalogoPage: path.resolve(
    projectRoot,
    "src",
    "modules",
    "catalogo",
    "pages",
    "CatalogoPage.tsx",
  ),
};

const readSource = (file) => readFile(file, "utf8");

const containsAll = (source, fragments) =>
  fragments.every((fragment) => source.includes(fragment));

function createControl(id, description, passed, detail) {
  return {
    id,
    description,
    passed,
    status: passed ? "OK" : "ERROR",
    detail,
  };
}

async function main() {
  const [api, apiClient, clientesPage, catalogoPage] = await Promise.all([
    readSource(files.api),
    readSource(files.apiClient),
    readSource(files.clientesPage),
    readSource(files.catalogoPage),
  ]);

  const controls = [
    createControl(
      "PAG-01",
      "Clientes utiliza el endpoint paginado",
      api.includes('apiClient.get("/clientes/paginado"'),
      "clienteService.page() debe consultar /clientes/paginado.",
    ),

    createControl(
      "PAG-02",
      "Vehículos utiliza el endpoint paginado",
      api.includes('apiClient.get("/vehiculos/paginado"'),
      "vehiculoService.page() debe consultar /vehiculos/paginado.",
    ),

    createControl(
      "PAG-03",
      "Compras utiliza el endpoint paginado",
      api.includes('apiClient.get("/compras/paginado"'),
      "compraService.page() debe consultar /compras/paginado.",
    ),

    createControl(
      "PAG-04",
      "Ventas utiliza el endpoint paginado",
      api.includes('apiClient.get("/ventas/paginado"'),
      "ventaService.page() debe consultar /ventas/paginado.",
    ),

    createControl(
      "PAG-05",
      "Catálogo utiliza el endpoint paginado",
      api.includes('apiClient.get("/catalogo/vehiculos/paginado"'),
      "catalogoService.page() debe consultar /catalogo/vehiculos/paginado.",
    ),

    createControl(
      "PAG-06",
      "El contrato paginado de clientes admite búsqueda server-side",
      /interface\s+ClientePageRequest\s+extends\s+PageRequest[\s\S]*?q\?:\s*string\s*;/.test(
        api,
      ),
      "ClientePageRequest debe exponer q?: string junto con page y size heredados de PageRequest.",
    ),

    createControl(
      "PAG-07",
      "ClientesPage consulta una página real y no descarga el listado completo",
      clientesPage.includes("clienteService.page(") &&
        !clientesPage.includes("clienteService.list("),
      "La vista debe usar clienteService.page() y no clienteService.list().",
    ),

    createControl(
      "PAG-08",
      "ClientesPage no filtra el listado completo con useMemo",
      !/\buseMemo\b/.test(clientesPage),
      "La búsqueda no debe resolverse mediante useMemo sobre una colección completa.",
    ),

    createControl(
      "PAG-09",
      "ClientesPage transmite q al backend",
      /\.\.\.\(query\s*\?\s*\{\s*q:\s*query\s*\}\s*:\s*\{\}\)/s.test(
        clientesPage,
      ) || /q:\s*query/.test(clientesPage),
      "El criterio de búsqueda aplicado debe viajar como parámetro q.",
    ),

    createControl(
      "PAG-10",
      "ClientesPage transmite page y size al backend",
      containsAll(clientesPage, [
        "page,",
        "size: PAGE_SIZE",
      ]),
      "La consulta debe enviar el número de página actual y PAGE_SIZE.",
    ),

    createControl(
      "PAG-11",
      "Una nueva búsqueda reinicia la paginación",
      /const\s+applySearch\s*=\s*\(\)\s*=>\s*\{[\s\S]*?setQuery\([\s\S]*?setPage\(0\);[\s\S]*?\};/.test(
        clientesPage,
      ),
      "applySearch() debe ejecutar setPage(0) después de aplicar el criterio.",
    ),

    createControl(
      "PAG-12",
      "PaginationControls utiliza metadatos devueltos por el servidor",
      containsAll(clientesPage, [
        "<PaginationControls",
        "page={data?.number ?? 0}",
        "totalPages={data?.totalPages ?? 0}",
        "totalElements={data?.totalElements ?? 0}",
        "onPageChange={setPage}",
      ]),
      "La navegación debe basarse en number, totalPages y totalElements de la respuesta paginada.",
    ),

    createControl(
      "PAG-13",
      "Catálogo delega el orden al servidor y no ordena localmente la página recibida",
      catalogoPage.includes("sort: SERVER_SORT_OPTIONS[sort]") &&
        !/\.sort\s*\(/.test(catalogoPage),
      "CatalogoPage debe enviar sort al backend y no ejecutar Array.sort() sobre data.content.",
    ),

    createControl(
      "PAG-14",
      "asPage exige una respuesta paginada real",
      containsAll(apiClient, [
        "Array.isArray(value)",
        "number === undefined",
        "size === undefined",
        "totalElements === undefined",
        "totalPages === undefined",
        "throw new TypeError",
        "serverPaged: true",
      ]),
      "asPage() debe rechazar arreglos y exigir content/items más metadatos de paginación válidos.",
    ),
  ];

  const passed = controls.filter(
    (control) => control.passed,
  ).length;

  const failed = controls.length - passed;

  const success = failed === 0;

  const generatedAt = new Date().toISOString();

  const result = {
    validation: "FE-18 - Paginación server-side",
    mode: "static",
    generatedAt,
    status: success ? "OK" : "ERROR",

    summary: {
      total: controls.length,
      passed,
      failed,
      message: `${passed}/${controls.length} controles correctos`,
    },

    evidenceDirectory:
      "evidencias/paginacion-server-side",

    inspectedFiles: [
      "src/services/api.ts",
      "src/services/apiClient.ts",
      "src/modules/clientes/pages/ClientesPage.tsx",
      "src/modules/catalogo/pages/CatalogoPage.tsx",
    ],

    controls,
  };

  const logLines = [
    "Automotora Pamahe - Validación estática de paginación server-side",
    `Fecha: ${generatedAt}`,
    `Resultado: ${passed}/${controls.length} controles correctos`,
    "",

    ...controls.map(
      (control) =>
        `[${control.status}] ${control.id} - ${control.description}\n` +
        `    ${control.detail}`,
    ),

    "",

    success
      ? "VALIDACIÓN CORRECTA: los controles estáticos de paginación server-side fueron satisfechos."
      : `VALIDACIÓN CON ERRORES: ${failed} control(es) no fueron satisfechos.`,

    "",
  ];

  await mkdir(evidenceDir, {
    recursive: true,
  });

  await Promise.all([
    writeFile(
      path.join(
        evidenceDir,
        "resultado.json",
      ),
      `${JSON.stringify(result, null, 2)}\n`,
      "utf8",
    ),

    writeFile(
      path.join(
        evidenceDir,
        "validacion-estatica.log",
      ),
      logLines.join("\n"),
      "utf8",
    ),
  ]);

  console.log(
    `Paginación server-side: ${passed}/${controls.length} controles correctos.`,
  );

  console.log(
    `Evidencia: ${evidenceDir}`,
  );

  if (!success) {
    for (
      const control of controls.filter(
        (item) => !item.passed,
      )
    ) {
      console.error(
        `- ${control.id}: ${control.description}`,
      );
    }

    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(
    "No se pudo completar la validación de paginación server-side.",
  );

  console.error(
    error instanceof Error
      ? error.stack ?? error.message
      : error,
  );

  process.exitCode = 1;
});