import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  launchBrowser,
  loginUi,
  clearSession,
  setFieldByLabel,
  clickButton,
  waitForText,
  waitForPath,
  waitFor,
  setOffline,
  screenshot,
  sleep,
} from "./browser-tools.mjs";

const baseUrl = (
  process.env.PAMAHE_E2E_BASE_URL || "http://127.0.0.1:15173"
).replace(/\/+$/, "");
const apiUrl = (
  process.env.PAMAHE_E2E_API_URL || "http://127.0.0.1:18080/api"
).replace(/\/+$/, "");
const SYNCED_QUEUE_LABEL = "Registrada correctamente";
const evidenceDir = path.resolve(
  process.env.PAMAHE_CQ03_EVIDENCE_DIR || "evidencia/CQ-03",
);
const runId =
  process.env.PAMAHE_E2E_RUN_ID ||
  new Date().toISOString().replaceAll(":", "-");

const credentials = {
  admin: { username: "admin", password: "AdminE2E!2026" },
  vendedor: { username: "vendedor.e2e", password: "VendedorE2E!2026" },
  taller: { username: "taller.e2e", password: "TallerE2E!2026" },
};

const data = {
  fecha: "2026-09-29",
  vendedorDocumento: "E2EVEND001",
  compradorDocumento: "E2ECOMP001",
  matricula: "E2E2601",
  marca: "Pamahe",
  modelo: "Integracion CQ03",
  descripcionOffline: "CQ03 refacción offline idempotente",
};

const log = [];
const context = { runId, baseUrl, apiUrl, data };

function record(name, status, detail = {}) {
  log.push({ at: new Date().toISOString(), name, status, detail });
  console.log(`[${status}] ${name}`);
}

async function apiRequest(
  pathname,
  { token, method = "GET", body, accept = "application/json" } = {},
) {
  const response = await fetch(`${apiUrl}${pathname}`, {
    method,
    headers: {
      Accept: accept,
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.arrayBuffer();
  return { response, payload };
}

async function apiLogin(key) {
  const creds = credentials[key];
  const { response, payload } = await apiRequest("/auth/login", {
    method: "POST",
    body: creds,
  });
  if (!response.ok || payload?.ok === false || !payload?.data?.token) {
    throw new Error(`No se pudo autenticar ${key}: HTTP ${response.status}`);
  }
  return payload.data.token;
}

function unwrap(result) {
  if (!result.response.ok) {
    throw new Error(
      `HTTP ${result.response.status}: ${JSON.stringify(result.payload).slice(0, 1000)}`,
    );
  }
  return result.payload?.data ?? result.payload;
}

async function saveEvidence() {
  await mkdir(evidenceDir, { recursive: true });
  await writeFile(
    path.join(evidenceDir, "context.json"),
    `${JSON.stringify(context, null, 2)}\n`,
  );
  await writeFile(
    path.join(evidenceDir, "cq03-real-stack.json"),
    `${JSON.stringify({ runId, passed: !log.some((item) => item.status === "FAIL"), steps: log }, null, 2)}\n`,
  );
  await writeFile(
    path.join(evidenceDir, "cq03-real-stack.log"),
    `${log.map((item) => `${item.at} [${item.status}] ${item.name} ${JSON.stringify(item.detail)}`).join("\n")}\n`,
  );
}

async function main() {
  await mkdir(evidenceDir, { recursive: true });
  let browser;
  try {
    record("preflight-stack", "RUN");
    const health = await fetch(`${apiUrl}/actuator/health`);
    if (!health.ok)
      throw new Error(`Backend no saludable: HTTP ${health.status}`);
    const front = await fetch(baseUrl);
    if (!front.ok)
      throw new Error(`Frontend no disponible: HTTP ${front.status}`);
    record("preflight-stack", "PASS", {
      backend: health.status,
      frontend: front.status,
    });

    const [adminToken, vendedorToken, tallerToken] = await Promise.all([
      apiLogin("admin"),
      apiLogin("vendedor"),
      apiLogin("taller"),
    ]);
    context.tokensVerified = ["admin", "vendedor", "taller"];
    record("usuarios-e2e", "PASS", { roles: context.tokensVerified });

    browser = await launchBrowser();
    const { cdp } = browser;

    await loginUi(
      cdp,
      baseUrl,
      credentials.admin.username,
      credentials.admin.password,
    );
    await waitForText(cdp, "Administrador E2E");
    await screenshot(cdp, path.join(evidenceDir, "01-login-admin.png"));
    record("login-ui-admin", "PASS");

    await cdp.navigate(`${baseUrl}/app/clientes/nuevo`);
    await setFieldByLabel(cdp, "Nombre", "Cliente");
    await setFieldByLabel(cdp, "Apellido", "Vendedor E2E");
    await setFieldByLabel(cdp, "Documento", data.vendedorDocumento);
    await setFieldByLabel(cdp, "Teléfono", "099111111");
    await setFieldByLabel(cdp, "Email", "vendedor.cliente.e2e@pamahe.local");
    await setFieldByLabel(cdp, "Tipo", "VENDEDOR");
    await clickButton(cdp, "Guardar cliente");
    await waitForPath(cdp, "/app/clientes");
    await waitForText(cdp, data.vendedorDocumento);
    const clientesAdmin = unwrap(
      await apiRequest("/clientes", { token: adminToken }),
    );
    const clienteVendedor = clientesAdmin.find(
      (item) => item.documento === data.vendedorDocumento,
    );
    if (!clienteVendedor)
      throw new Error("El cliente vendedor no quedó persistido en MySQL.");
    context.clienteVendedorId = clienteVendedor.id;
    record("cliente-vendedor-ui-db", "PASS", { id: clienteVendedor.id });

    await cdp.navigate(`${baseUrl}/app/vehiculos/nuevo`);
    await setFieldByLabel(cdp, "Marca", data.marca);
    await setFieldByLabel(cdp, "Modelo", data.modelo);
    await waitForText(cdp, "Automóvil");
    await setFieldByLabel(cdp, "Tipo de vehículo", "AUTO");
    await setFieldByLabel(cdp, "Año", "2022");
    await setFieldByLabel(cdp, "Matrícula", data.matricula);
    await setFieldByLabel(cdp, "Color", "Azul");
    await setFieldByLabel(cdp, "Kilometraje", "41000");
    await setFieldByLabel(cdp, "Precio de venta estimado", "850000");
    await setFieldByLabel(
      cdp,
      "Descripción pública",
      "Vehículo E2E para cierre CQ-03.",
    );
    await clickButton(cdp, "Guardar vehículo");
    await waitForPath(cdp, "/app/vehiculos");
    await waitForText(cdp, data.matricula);
    const vehiculosAdmin = unwrap(
      await apiRequest("/vehiculos", { token: adminToken }),
    );
    const vehiculo = vehiculosAdmin.find(
      (item) => item.matricula === data.matricula,
    );
    if (!vehiculo) throw new Error("El vehículo no quedó persistido en MySQL.");
    context.vehiculoId = vehiculo.id;
    record("vehiculo-ui-db", "PASS", { id: vehiculo.id });

    await cdp.navigate(`${baseUrl}/app/compras/nueva`);
    await waitForText(cdp, data.matricula);
    await setFieldByLabel(cdp, "Vehículo", String(vehiculo.id));
    await setFieldByLabel(cdp, "Cliente vendedor", String(clienteVendedor.id));
    await setFieldByLabel(cdp, "Fecha", data.fecha);
    await setFieldByLabel(cdp, "Costo de adquisición", "500000");
    await setFieldByLabel(
      cdp,
      "Observaciones",
      "Compra creada por CQ-03 real.",
    );
    await clickButton(cdp, "Registrar compra");
    await waitForText(cdp, "Compra registrada correctamente");
    await screenshot(cdp, path.join(evidenceDir, "02-compra.png"));
    const compras = unwrap(await apiRequest("/compras", { token: adminToken }));
    const compra = compras.find(
      (item) =>
        item.vehiculoId === vehiculo.id ||
        item.vehiculo?.includes(data.matricula),
    );
    if (!compra) throw new Error("La compra no quedó persistida.");
    context.compraId = compra.id;
    record("compra-ui-db", "PASS", { id: compra.id });

    await clearSession(cdp);
    await loginUi(
      cdp,
      baseUrl,
      credentials.taller.username,
      credentials.taller.password,
    );
    await cdp.navigate(`${baseUrl}/app/vehiculos/${vehiculo.id}`);
    await waitForText(cdp, data.matricula);
    await clickButton(cdp, "EN TALLER");
    await waitForText(cdp, "Estado actualizado");
    record("estado-en-taller", "PASS");

    await cdp.navigate(`${baseUrl}/app/taller/nueva`);
    await waitForText(cdp, data.matricula);
    await setFieldByLabel(cdp, "Vehículo", String(vehiculo.id));
    await setFieldByLabel(cdp, "Fecha", data.fecha);
    await setFieldByLabel(cdp, "Tipo de trabajo", "MECANICA");
    await setFieldByLabel(cdp, "Estado", "FINALIZADA");
    await setFieldByLabel(cdp, "Costo de repuestos", "7000");
    await setFieldByLabel(cdp, "Costo de mano de obra", "3000");
    await setFieldByLabel(cdp, "Servicios externos", "0");
    await setFieldByLabel(cdp, "Descripción", "CQ03 mantenimiento E2E real");
    await clickButton(cdp, "Guardar refacción");
    await waitForPath(cdp, "/app/taller/offline");
    await waitForText(cdp, SYNCED_QUEUE_LABEL, 20_000);
    record("refaccion-online-ui-db", "PASS");

    await cdp.navigate(`${baseUrl}/app/taller/nueva`);
    await waitForText(cdp, data.matricula);
    await setOffline(cdp, true);
    await waitForText(cdp, "Se guardará en este dispositivo");
    await setFieldByLabel(cdp, "Vehículo", String(vehiculo.id));
    await setFieldByLabel(cdp, "Fecha", data.fecha);
    await setFieldByLabel(cdp, "Tipo de trabajo", "LIMPIEZA");
    await setFieldByLabel(cdp, "Estado", "FINALIZADA");
    await setFieldByLabel(cdp, "Costo de repuestos", "0");
    await setFieldByLabel(cdp, "Costo de mano de obra", "900");
    await setFieldByLabel(cdp, "Servicios externos", "0");
    await setFieldByLabel(cdp, "Descripción", data.descripcionOffline);
    await clickButton(cdp, "Guardar en el dispositivo");
    await waitForPath(cdp, "/app/taller/offline");
    const offlineLocal = await cdp.evaluate(`(async () => {
      const databases =
        typeof indexedDB.databases === 'function'
          ? await indexedDB.databases()
          : [];

      for (const databaseInfo of databases) {
        if (!databaseInfo.name) {
          continue;
        }

        const db = await new Promise((resolve, reject) => {
          const request = indexedDB.open(databaseInfo.name);

          request.onsuccess = () => resolve(request.result);
          request.onerror = () =>
            reject(
              request.error ??
                new Error(
                  'No se pudo abrir IndexedDB: ' +
                    databaseInfo.name
                )
            );
        });

        try {
          if (!db.objectStoreNames.contains('repairs')) {
            continue;
          }

          const rows = await new Promise((resolve, reject) => {
            const transaction = db.transaction(
              'repairs',
              'readonly'
            );

            const request = transaction
              .objectStore('repairs')
              .getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () =>
              reject(
                request.error ??
                  new Error(
                    'No se pudo leer la cola offline.'
                  )
              );
          });

          const match = rows.find(
            (item) =>
              item?.payload?.descripcion ===
              ${JSON.stringify(data.descripcionOffline)}
          );

          if (match) {
            return {
              found: true,
              database: databaseInfo.name,
              id: match.id,
              status: match.status ?? 'pending',
              owner: match.owner ?? null,
              apiUrl: match.apiUrl ?? null,
              descripcion:
                match.payload?.descripcion ?? null
            };
          }
        } finally {
          db.close();
        }
      }

      return {
        found: false
      };
    })()`);

    if (!offlineLocal?.found) {
      throw new Error("La refacción offline no quedó persistida en IndexedDB.");
    }

    const validOfflineStatuses = ["pending", "syncing", "retry", "synced"];

    if (!validOfflineStatuses.includes(offlineLocal.status)) {
      throw new Error(`Estado offline inesperado: ${offlineLocal.status}`);
    }

    context.offlineLocal = offlineLocal;

    record("offline-indexeddb-real", "PASS", {
      id: offlineLocal.id,
      status: offlineLocal.status,
      database: offlineLocal.database,
      sincronizacionAnticipada: offlineLocal.status === "synced",
    });

    await screenshot(
      cdp,
      path.join(
        evidenceDir,
        offlineLocal.status === "synced"
          ? "03-offline-sincronizada-anticipadamente.png"
          : "03-offline-pendiente.png",
      ),
    );

    await setOffline(cdp, false);

    await waitFor(
      () => cdp.evaluate("navigator.onLine === true"),
      "El navegador no recuperó estado online.",
    );

    await sleep(500);

    await cdp.navigate(`${baseUrl}/app/taller/offline`);

    await waitFor(
      () =>
        cdp.evaluate(`(() => {
          const text =
            document.body?.innerText ?? '';

          return (
            text.includes(${JSON.stringify(SYNCED_QUEUE_LABEL)}) ||
            text.includes(
              'Sincronizar ahora'
            )
          );
        })()`),
      "La cola offline no quedó disponible al recuperar la conexión.",
      20_000,
      100,
    );

    const alreadySynced = await cdp.evaluate(
      `document.body.innerText.includes(${JSON.stringify(SYNCED_QUEUE_LABEL)})`,
    );

    if (!alreadySynced) {
      await clickButton(cdp, "Sincronizar ahora");
    }

    await waitForText(cdp, SYNCED_QUEUE_LABEL, 20_000);

    await screenshot(
      cdp,
      path.join(evidenceDir, "04-offline-sincronizada.png"),
    );
    const repairs = unwrap(
      await apiRequest(`/taller/refacciones/vehiculos/${vehiculo.id}`, {
        token: tallerToken,
      }),
    );
    const offlineMatches = repairs.filter(
      (item) => item.descripcion === data.descripcionOffline,
    );
    if (offlineMatches.length !== 1)
      throw new Error(
        `Idempotencia offline inválida: ${offlineMatches.length} coincidencias.`,
      );
    context.offlineRefaccionId = offlineMatches[0].id;
    record("offline-idempotencia-real", "PASS", {
      refaccionId: offlineMatches[0].id,
      count: offlineMatches.length,
    });

    await cdp.navigate(`${baseUrl}/app/vehiculos/${vehiculo.id}`);
    await clickButton(cdp, "DISPONIBLE");
    await waitForText(cdp, "Estado actualizado");
    record("estado-disponible", "PASS");

    await clearSession(cdp);
    await loginUi(
      cdp,
      baseUrl,
      credentials.vendedor.username,
      credentials.vendedor.password,
    );
    await cdp.navigate(`${baseUrl}/app/vehiculos/${vehiculo.id}`);
    await waitForText(cdp, data.matricula);
    await clickButton(cdp, "Publicar en catálogo");
    await waitForText(cdp, "Publicación actualizada");
    record("publicacion-ui", "PASS");

    await cdp.navigate(`${baseUrl}/catalogo`);
    await waitForText(cdp, `${data.marca} ${data.modelo}`, 20_000);
    await screenshot(cdp, path.join(evidenceDir, "05-catalogo-publicado.png"));
    await cdp.navigate(`${baseUrl}/catalogo/${vehiculo.id}`);
    await waitForText(cdp, `${data.marca} ${data.modelo}`);
    record("catalogo-publico-real", "PASS", { vehiculoId: vehiculo.id });

    await cdp.navigate(`${baseUrl}/app/clientes/nuevo`);
    await setFieldByLabel(cdp, "Nombre", "Cliente");
    await setFieldByLabel(cdp, "Apellido", "Comprador E2E");
    await setFieldByLabel(cdp, "Documento", data.compradorDocumento);
    await setFieldByLabel(cdp, "Teléfono", "099222222");
    await setFieldByLabel(cdp, "Email", "comprador.e2e@pamahe.local");
    await setFieldByLabel(cdp, "Tipo", "COMPRADOR");
    await clickButton(cdp, "Guardar cliente");
    await waitForPath(cdp, "/app/clientes");
    const clientesVendedor = unwrap(
      await apiRequest("/clientes", { token: vendedorToken }),
    );
    const clienteComprador = clientesVendedor.find(
      (item) => item.documento === data.compradorDocumento,
    );
    if (!clienteComprador)
      throw new Error("El cliente comprador no quedó persistido.");
    context.clienteCompradorId = clienteComprador.id;
    record("cliente-comprador-ui-db", "PASS", { id: clienteComprador.id });

    await cdp.navigate(`${baseUrl}/app/ventas/nueva`);
    await waitForText(cdp, data.matricula);
    await setFieldByLabel(cdp, "Vehículo", String(vehiculo.id));
    await setFieldByLabel(
      cdp,
      "Cliente comprador",
      String(clienteComprador.id),
    );
    await setFieldByLabel(cdp, "Fecha", data.fecha);
    await setFieldByLabel(cdp, "Precio final", "720000");
    await setFieldByLabel(
      cdp,
      "Observaciones",
      "Venta CQ-03 extremo a extremo.",
    );
    await clickButton(cdp, "Cerrar venta");
    await waitForText(cdp, "Venta #", 20_000);
    const ventas = unwrap(
      await apiRequest("/ventas", { token: vendedorToken }),
    );
    const venta = ventas.find(
      (item) =>
        item.vehiculoId === vehiculo.id || item.vehiculo?.includes(data.modelo),
    );
    if (!venta) throw new Error("La venta no quedó persistida.");
    context.ventaId = venta.id;
    await screenshot(cdp, path.join(evidenceDir, "06-venta.png"));
    record("venta-ui-db", "PASS", { id: venta.id });

    await cdp.navigate(`${baseUrl}/app/vehiculos/${vehiculo.id}`);
    await waitForText(cdp, "Cambios de estado y publicación");
    await waitForText(cdp, "Cambio de estado");
    await waitForText(cdp, "Cambio de publicación");
    await screenshot(cdp, path.join(evidenceDir, "07-historial.png"));
    record("historial-cf01-real", "PASS");

    let receiptStatus = 0;
    await waitFor(
      async () => {
        const result = await apiRequest(`/ventas/${venta.id}/comprobante`, {
          token: vendedorToken,
          accept: "application/pdf",
        });
        receiptStatus = result.response.status;
        return (
          result.response.ok &&
          (result.response.headers.get("content-type") || "").includes(
            "application/pdf",
          )
        );
      },
      "El comprobante PDF de la venta no quedó disponible.",
      30_000,
      500,
    );
    record("comprobante-venta-real", "PASS", { status: receiptStatus });

    await clearSession(cdp);
    await loginUi(
      cdp,
      baseUrl,
      credentials.admin.username,
      credentials.admin.password,
    );
    await cdp.navigate(`${baseUrl}/app/reportes`);
    await waitForText(cdp, "Reportes de gestión");
    await setFieldByLabel(cdp, "Reporte", "ventas");
    await setFieldByLabel(cdp, "Desde", data.fecha);
    await setFieldByLabel(cdp, "Hasta", data.fecha);
    await clickButton(cdp, "Consultar período");
    await waitForText(cdp, `${data.marca} ${data.modelo}`, 20_000);
    await screenshot(cdp, path.join(evidenceDir, "08-reporte-ventas.png"));
    record("reportes-cf02-real", "PASS");

    const forbidden = await apiRequest("/reportes/rentabilidad", {
      token: tallerToken,
    });
    if (forbidden.response.status !== 403)
      throw new Error(
        `RBAC esperaba 403 y obtuvo ${forbidden.response.status}.`,
      );
    record("rbac-403-real", "PASS", {
      role: "TALLER",
      endpoint: "/reportes/rentabilidad",
    });

    const unauthorized = await apiRequest("/vehiculos", {
      token: "token-invalido-cq03",
    });
    if (unauthorized.response.status !== 401)
      throw new Error(
        `JWT inválido esperaba 401 y obtuvo ${unauthorized.response.status}.`,
      );
    record("jwt-401-real", "PASS", { endpoint: "/vehiculos" });

    const finalVehicle = unwrap(
      await apiRequest(`/vehiculos/${vehiculo.id}`, { token: adminToken }),
    );
    if (finalVehicle.estado !== "VENDIDO" || finalVehicle.publicado) {
      throw new Error(
        `Estado final incoherente: ${finalVehicle.estado}, publicado=${finalVehicle.publicado}`,
      );
    }
    context.finalVehicle = {
      estado: finalVehicle.estado,
      publicado: finalVehicle.publicado,
    };
    record("persistencia-final-mysql", "PASS", context.finalVehicle);

    await saveEvidence();
    console.log(`CQ-03 completado. Evidencia: ${evidenceDir}`);
  } catch (error) {
    record("cq03", "FAIL", { message: error.message, stack: error.stack });
    await saveEvidence();
    throw error;
  } finally {
    await browser?.close();
  }
}

await main();
