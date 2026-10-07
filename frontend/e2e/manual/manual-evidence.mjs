import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import {
  captureEvidence,
  clearSession,
  clickButton,
  clickByText,
  launchBrowser,
  loginUi,
  makeLogger,
  setCheckboxByText,
  setFieldByLabel,
  setInputBySelector,
  setOffline,
  sleep,
  uploadFirstFileInput,
  waitFor,
  waitForPath,
  waitForText,
  writeManifest,
} from './manual-evidence-tools.mjs';

const baseUrl = (
  process.env.PAMAHE_MANUAL_BASE_URL ||
  process.env.PAMAHE_E2E_BASE_URL ||
  'http://127.0.0.1:15173'
).replace(/\/+$/, '');

const apiUrl = (
  process.env.PAMAHE_MANUAL_API_URL ||
  process.env.PAMAHE_E2E_API_URL ||
  'http://127.0.0.1:18080/api'
).replace(/\/+$/, '');

const runId =
  process.env.PAMAHE_MANUAL_RUN_ID ||
  new Date().toISOString().replaceAll(':', '-');

const evidenceDir = path.resolve(
  process.env.PAMAHE_MANUAL_EVIDENCE_DIR ||
    `evidencia/manual-usuario/${runId}`,
);

const fixtureImage = path.resolve(
  'e2e/manual/fixtures/toyota-camry-xle-2020.png',
);

const suffix = String(Date.now()).slice(-6);
const short = suffix.slice(-4);

const credentials = {
  admin: {
    username: process.env.PAMAHE_MANUAL_ADMIN_USER || 'admin',
    password:
      process.env.PAMAHE_MANUAL_ADMIN_PASSWORD || 'AdminE2E!2026',
  },
  vendedor: {
    username:
      process.env.PAMAHE_MANUAL_SELLER_USER || 'vendedor.e2e',
    password:
      process.env.PAMAHE_MANUAL_SELLER_PASSWORD ||
      'VendedorE2E!2026',
  },
  taller: {
    username:
      process.env.PAMAHE_MANUAL_WORKSHOP_USER || 'taller.e2e',
    password:
      process.env.PAMAHE_MANUAL_WORKSHOP_PASSWORD ||
      'TallerE2E!2026',
  },
};

const now = new Date();

const localIsoDate =
  `${now.getFullYear()}-` +
  `${String(now.getMonth() + 1).padStart(2, '0')}-` +
  `${String(now.getDate()).padStart(2, '0')}`;

const data = {
  fecha: localIsoDate,
  usuarioNuevo: {
    username: `martin.ferreira.${short}`,
    nombre: 'Martín Ferreira',
    email: `martin.ferreira.${short}@pamahe.local`,
    telefono: `09945${short}`,
    password: 'PamaheManual!2026',
  },
  clienteVendedor: {
    nombre: 'Lucía',
    apellido: 'Fernández',
    documento: `4568${suffix}`,
    telefono: `09831${short}`,
    email: `lucia.fernandez.${short}@correo.uy`,
    direccion: 'Rivera 742, Juan Lacaze, Colonia',
    tipo: 'VENDEDOR',
  },
  clienteComprador: {
    nombre: 'Diego',
    apellido: 'Pereira',
    documento: `3987${suffix}`,
    telefono: `09962${short}`,
    email: `diego.pereira.${short}@correo.uy`,
    direccion: 'José Enrique Rodó 1185, Juan Lacaze, Colonia',
    tipo: 'COMPRADOR',
  },
  vehiculo: {
    marca: 'Toyota',
    modelo: 'Camry XLE',
    tipo: 'AUTO',
    anio: '2020',
    matricula: `SBC${short}`,
    chasis: `4T1G11AK9LU${suffix}`.slice(0, 17),
    color: 'Gris plata',
    kilometraje: '64500',
    precioEstimado: '1190000',
    descripcion:
      'Toyota Camry XLE 2020, sedán automático, interior cuidado y excelente nivel de confort.',
    observaciones:
      'Unidad recibida en buen estado general. Revisión preventiva antes de publicación.',
  },
  compra: {
    costo: '870000',
    observaciones:
      'Compra acordada con documentación revisada y entrega de la unidad en el local.',
  },
  refaccion: {
    descripcion:
      'Service preventivo: cambio de aceite y filtros, revisión de frenos y chequeo general.',
    repuestos: '18500',
    manoObra: '6500',
    externos: '0',
  },
  refaccionOffline: {
    descripcion:
      'Limpieza interior final y acondicionamiento previo a la publicación.',
    repuestos: '0',
    manoObra: '3500',
    externos: '0',
  },
  venta: {
    precio: '1150000',
    observaciones:
      'Venta concretada luego de prueba de manejo y revisión de documentación.',
  },
};

const manifest = [];
const logLines = [];
const log = makeLogger(logLines);

const metadata = {
  runId,
  baseUrl,
  apiUrl,
  data,
};

async function apiRequest(
  pathname,
  {
    token,
    method = 'GET',
    body,
    accept = 'application/json',
  } = {},
) {
  const response = await fetch(`${apiUrl}${pathname}`, {
    method,
    headers: {
      Accept: accept,
      ...(body
        ? {
            'Content-Type': 'application/json',
          }
        : {}),
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType =
    response.headers.get('content-type') || '';

  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.arrayBuffer();

  return {
    response,
    payload,
  };
}

function unwrap(result) {
  if (!result.response.ok) {
    throw new Error(
      `HTTP ${result.response.status}: ${JSON.stringify(
        result.payload,
      ).slice(0, 900)}`,
    );
  }

  return result.payload?.data ?? result.payload;
}

function rowsOf(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.content)) {
    return value.content;
  }

  if (Array.isArray(value?.items)) {
    return value.items;
  }

  return [];
}

async function apiLogin(creds) {
  const result = await apiRequest('/auth/login', {
    method: 'POST',
    body: creds,
  });

  const responseData = unwrap(result);
  const token = responseData?.token;

  if (!token) {
    throw new Error(
      `No se recibió token para ${creds.username}.`,
    );
  }

  return token;
}

async function findBy(pathname, token, predicate) {
  const result = unwrap(
    await apiRequest(pathname, {
      token,
    }),
  );

  return rowsOf(result).find(predicate);
}

async function capture(
  cdp,
  section,
  order,
  title,
  description,
) {
  return captureEvidence({
    cdp,
    evidenceDir,
    section,
    order,
    title,
    description,
    manifest,
  });
}

async function clickAria(cdp, label) {
  const ok = await cdp.evaluate(`(() => {
    const el = document.querySelector(
      '[aria-label=${JSON.stringify(label)}]'
    );

    if (!el) {
      return false;
    }

    el.click();
    return true;
  })()`);

  if (!ok) {
    throw new Error(
      `No se encontró el control aria-label=${label}`,
    );
  }
}

async function waitForServerRepair(
  token,
  vehicleId,
  description,
  timeoutMs = 30_000,
) {
  const deadline = Date.now() + timeoutMs;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const result = unwrap(
        await apiRequest(
          `/taller/refacciones/vehiculos/${vehicleId}`,
          { token },
        ),
      );

      const matches = rowsOf(result).filter(
        (item) => item.descripcion === description,
      );

      if (matches.length === 1) {
        return matches[0];
      }

      if (matches.length > 1) {
        throw new Error(
          `Se encontraron ${matches.length} refacciones duplicadas para: ${description}`,
        );
      }
    } catch (cause) {
      lastError = cause;
    }

    await sleep(250);
  }

  throw new Error(
    `La refacción no quedó confirmada en el servidor: ${description}` +
      (lastError instanceof Error
        ? ` Último error: ${lastError.message}`
        : ''),
  );
}

async function readOfflineRepair(cdp, description) {
  return cdp.evaluate(`(async () => {
    const description = ${JSON.stringify(description)};

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
            item?.payload?.descripcion === description
        );

        if (match) {
          return {
            found: true,
            database: databaseInfo.name,
            id: match.id ?? null,
            status: match.status ?? 'pending',
            serverId: match.serverId ?? null,
            owner: match.owner ?? null,
            apiUrl: match.apiUrl ?? null,
            leaseUntil: match.leaseUntil ?? null,
            lastError: match.lastError ?? null
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
}

async function waitForOfflineRepair(
  cdp,
  description,
  acceptedStatuses,
  timeoutMs = 15_000,
) {
  const deadline = Date.now() + timeoutMs;
  let lastState;

  while (Date.now() < deadline) {
    lastState = await readOfflineRepair(
      cdp,
      description,
    );

    if (
      lastState?.found &&
      acceptedStatuses.includes(lastState.status)
    ) {
      return lastState;
    }

    await sleep(250);
  }

  throw new Error(
    `La refacción no quedó persistida en IndexedDB. Último estado: ${JSON.stringify(
      lastState,
    )}`,
  );
}

async function synchronizeOfflineRepair(
  cdp,
  description,
  timeoutMs = 90_000,
) {
  const deadline = Date.now() + timeoutMs;
  let lastState;
  let attempts = 0;
  let lastAttemptAt = 0;

  while (Date.now() < deadline) {
    lastState = await readOfflineRepair(
      cdp,
      description,
    );

    if (lastState?.found) {
      if (lastState.status === 'synced') {
        return lastState;
      }

      if (
        ['auth_required', 'conflict', 'failed'].includes(
          lastState.status,
        )
      ) {
        throw new Error(
          `La sincronización terminó en estado ${lastState.status}: ${
            lastState.lastError ?? 'sin detalle adicional'
          }`,
        );
      }
    }

    const canSynchronize =
      await cdp.evaluate(`(() => {
        const button = [
          ...document.querySelectorAll('button')
        ].find((node) =>
          String(node.textContent ?? '')
            .trim()
            .includes('Sincronizar ahora')
        );

        return Boolean(
          button &&
          !button.disabled
        );
      })()`);

    if (
      canSynchronize &&
      attempts < 2 &&
      Date.now() - lastAttemptAt >= 3_000
    ) {
      await clickButton(
        cdp,
        'Sincronizar ahora',
      );

      attempts += 1;
      lastAttemptAt = Date.now();
    }

    await sleep(250);
  }

  throw new Error(
    `La refacción offline no alcanzó estado synced. Último estado: ${JSON.stringify(
      lastState,
    )}`,
  );
}

async function main() {
  await mkdir(evidenceDir, {
    recursive: true,
  });

  let browser;

  try {
    log('Preflight del entorno real', 'RUN');

    const health = await fetch(
      `${apiUrl}/actuator/health`,
    );

    const front = await fetch(baseUrl);

    if (!health.ok) {
      throw new Error(
        `Backend no disponible: HTTP ${health.status}`,
      );
    }

    if (!front.ok) {
      throw new Error(
        `Frontend no disponible: HTTP ${front.status}`,
      );
    }

    log('Preflight del entorno real', 'PASS');

    const [
      adminToken,
      vendedorToken,
      tallerToken,
    ] = await Promise.all([
      apiLogin(credentials.admin),
      apiLogin(credentials.vendedor),
      apiLogin(credentials.taller),
    ]);

    browser = await launchBrowser({
      headless:
        process.env.PAMAHE_MANUAL_HEADFUL !== '1',
    });

    const { cdp } = browser;

    await cdp.navigate(`${baseUrl}/`);

    await capture(
      cdp,
      '01-acceso-seguridad',
      1,
      'Inicio público',
      'Portada pública de Pamahe antes de iniciar sesión.',
    );

    await cdp.navigate(`${baseUrl}/login`);

    await capture(
      cdp,
      '01-acceso-seguridad',
      2,
      'Pantalla de inicio de sesión',
      'Formulario de acceso para usuarios internos.',
    );

    await setFieldByLabel(
      cdp,
      'Usuario',
      credentials.admin.username,
    );

    await setFieldByLabel(
      cdp,
      'Contraseña',
      'ClaveIncorrecta!2026',
    );

    await clickButton(
      cdp,
      'Ingresar al sistema',
    );

    await waitForText(
      cdp,
      'Usuario o contraseña incorrectos',
    );

    await capture(
      cdp,
      '01-acceso-seguridad',
      3,
      'Credenciales incorrectas',
      'Ejemplo del mensaje claro que recibe el usuario cuando las credenciales no son válidas.',
    );

    await setFieldByLabel(
      cdp,
      'Usuario',
      credentials.admin.username,
    );

    await setFieldByLabel(
      cdp,
      'Contraseña',
      credentials.admin.password,
    );

    await clickButton(
      cdp,
      'Ingresar al sistema',
    );

    await waitForPath(
      cdp,
      '/app',
    );

    await capture(
      cdp,
      '01-acceso-seguridad',
      4,
      'Acceso correcto',
      'Pantalla inicial luego de autenticarse correctamente como administrador.',
    );

    await cdp.navigate(
      `${baseUrl}/app/dashboard`,
    );

    await waitForText(
      cdp,
      'Dashboard gerencial',
    );

    await capture(
      cdp,
      '02-administracion',
      1,
      'Dashboard gerencial',
      'Vista general de indicadores y acceso a información de gestión.',
    );

    await cdp.navigate(
      `${baseUrl}/app/usuarios`,
    );

    await waitForText(
      cdp,
      'Usuarios',
    );

    await capture(
      cdp,
      '02-administracion',
      2,
      'Listado de usuarios',
      'Gestión de usuarios internos, roles, edición y restablecimiento de contraseña.',
    );

    await cdp.navigate(
      `${baseUrl}/app/usuarios/nuevo`,
    );

    await clickButton(
      cdp,
      'Guardar',
    );

    await waitForText(
      cdp,
      'El usuario debe tener al menos 3 caracteres.',
    );

    await capture(
      cdp,
      '02-administracion',
      3,
      'Validaciones al crear usuario',
      'El formulario indica qué campos deben corregirse antes de poder crear una cuenta.',
    );

    await setFieldByLabel(
      cdp,
      'Usuario',
      data.usuarioNuevo.username,
    );

    await setFieldByLabel(
      cdp,
      'Nombre',
      data.usuarioNuevo.nombre,
    );

    await setFieldByLabel(
      cdp,
      'Email',
      data.usuarioNuevo.email,
    );

    await setFieldByLabel(
      cdp,
      'Teléfono',
      data.usuarioNuevo.telefono,
    );

    await setFieldByLabel(
      cdp,
      'Contraseña',
      data.usuarioNuevo.password,
    );

    await setCheckboxByText(
      cdp,
      'VENDEDOR',
      true,
    );

    await clickButton(
      cdp,
      'Guardar',
    );

    await waitForPath(
      cdp,
      '/app/usuarios',
    );

    await waitForText(
      cdp,
      data.usuarioNuevo.username,
    );

    await capture(
      cdp,
      '02-administracion',
      4,
      'Usuario creado',
      `Cuenta realista creada para ${data.usuarioNuevo.nombre} con rol VENDEDOR.`,
    );

    await cdp.navigate(
      `${baseUrl}/app/parametros`,
    );

    await waitForText(
      cdp,
      'Parámetros',
    );

    await capture(
      cdp,
      '02-administracion',
      5,
      'Parámetros del sistema',
      'Pantalla de administración de valores configurables utilizados por el sistema.',
    );

    await clickButton(
      cdp,
      'Nuevo parámetro',
    );

    await capture(
      cdp,
      '02-administracion',
      6,
      'Formulario de parámetro',
      'Formulario modal utilizado para crear un parámetro de configuración.',
    );

    await setFieldByLabel(
      cdp,
      'Categoría',
      'CONTACTO',
    );

    await setFieldByLabel(
      cdp,
      'Clave',
      `HORARIO_SABADO_${short}`,
    );

    await setFieldByLabel(
      cdp,
      'Valor',
      '09:00 a 13:00',
    );

    await setFieldByLabel(
      cdp,
      'Descripción',
      'Horario de atención de los sábados para consultas comerciales.',
    );

    await clickButton(
      cdp,
      'Crear parámetro',
    );

    await waitForText(
      cdp,
      'Parámetro creado',
    );

    await capture(
      cdp,
      '02-administracion',
      7,
      'Parámetro creado correctamente',
      'Confirmación de una configuración guardada correctamente.',
    );

    await cdp.navigate(
      `${baseUrl}/app/clientes`,
    );

    await waitForText(
      cdp,
      'Clientes',
    );

    await capture(
      cdp,
      '03-clientes-vehiculos',
      1,
      'Listado de clientes',
      'Pantalla para buscar, consultar, editar o desactivar clientes.',
    );

    await cdp.navigate(
      `${baseUrl}/app/clientes/nuevo`,
    );

    await clickButton(
      cdp,
      'Guardar cliente',
    );

    await waitForText(
      cdp,
      'Ingresá el nombre.',
    );

    await capture(
      cdp,
      '03-clientes-vehiculos',
      2,
      'Validaciones de cliente',
      'Ejemplo de validación antes de registrar información incompleta.',
    );

    for (const client of [
      data.clienteVendedor,
      data.clienteComprador,
    ]) {
      await setFieldByLabel(
        cdp,
        'Nombre',
        client.nombre,
      );

      await setFieldByLabel(
        cdp,
        'Apellido',
        client.apellido,
      );

      await setFieldByLabel(
        cdp,
        'Documento',
        client.documento,
      );

      await setFieldByLabel(
        cdp,
        'Teléfono',
        client.telefono,
      );

      await setFieldByLabel(
        cdp,
        'Email',
        client.email,
      );

      await setFieldByLabel(
        cdp,
        'Dirección',
        client.direccion,
      );

      await setFieldByLabel(
        cdp,
        'Tipo',
        client.tipo,
      );

      await clickButton(
        cdp,
        'Guardar cliente',
      );

      await waitForPath(
        cdp,
        '/app/clientes',
      );

      await waitForText(
        cdp,
        client.documento,
      );

      if (
        client === data.clienteVendedor
      ) {
        await capture(
          cdp,
          '03-clientes-vehiculos',
          3,
          'Cliente vendedor registrado',
          `Registro de ${client.nombre} ${client.apellido} como cliente vendedor.`,
        );

        await cdp.navigate(
          `${baseUrl}/app/clientes/nuevo`,
        );
      } else {
        await capture(
          cdp,
          '03-clientes-vehiculos',
          4,
          'Cliente comprador registrado',
          `Registro de ${client.nombre} ${client.apellido} como cliente comprador.`,
        );
      }
    }

    const seller = await findBy(
      '/clientes',
      adminToken,
      (x) =>
        x.documento ===
        data.clienteVendedor.documento,
    );

    const buyer = await findBy(
      '/clientes',
      adminToken,
      (x) =>
        x.documento ===
        data.clienteComprador.documento,
    );

    if (!seller || !buyer) {
      throw new Error(
        'No se pudieron recuperar los clientes creados.',
      );
    }

    metadata.clienteVendedorId =
      seller.id;

    metadata.clienteCompradorId =
      buyer.id;

    await cdp.navigate(
      `${baseUrl}/app/vehiculos`,
    );

    await waitForText(
      cdp,
      'Vehículos',
    );

    await capture(
      cdp,
      '03-clientes-vehiculos',
      5,
      'Inventario de vehículos',
      'Vista central del stock con filtros, estados operativos y acciones disponibles.',
    );

    await cdp.navigate(
      `${baseUrl}/app/vehiculos/nuevo`,
    );

    await clickButton(
      cdp,
      'Guardar vehículo',
    );

    await waitForText(
      cdp,
      'Ingresá la marca.',
    );

    await capture(
      cdp,
      '03-clientes-vehiculos',
      6,
      'Validaciones de vehículo',
      'El sistema evita registrar una unidad sin sus datos principales.',
    );

    await setFieldByLabel(
      cdp,
      'Marca',
      data.vehiculo.marca,
    );

    await setFieldByLabel(
      cdp,
      'Modelo',
      data.vehiculo.modelo,
    );

    await setFieldByLabel(
      cdp,
      'Tipo de vehículo',
      data.vehiculo.tipo,
    );

    await setFieldByLabel(
      cdp,
      'Año',
      data.vehiculo.anio,
    );

    await setFieldByLabel(
      cdp,
      'Matrícula',
      data.vehiculo.matricula,
    );

    await setFieldByLabel(
      cdp,
      'Número de chasis',
      data.vehiculo.chasis,
    );

    await setFieldByLabel(
      cdp,
      'Color',
      data.vehiculo.color,
    );

    await setFieldByLabel(
      cdp,
      'Kilometraje',
      data.vehiculo.kilometraje,
    );

    await setFieldByLabel(
      cdp,
      'Precio de venta estimado',
      data.vehiculo.precioEstimado,
    );

    await setFieldByLabel(
      cdp,
      'Descripción pública',
      data.vehiculo.descripcion,
    );

    await setFieldByLabel(
      cdp,
      'Observaciones internas',
      data.vehiculo.observaciones,
    );

    await capture(
      cdp,
      '03-clientes-vehiculos',
      7,
      'Alta de Toyota Camry',
      'Formulario completo con datos realistas antes de registrar una unidad.',
    );

    await clickButton(
      cdp,
      'Guardar vehículo',
    );

    await waitForPath(
      cdp,
      '/app/vehiculos',
    );

    await waitForText(
      cdp,
      data.vehiculo.matricula,
    );

    const vehicle = await findBy(
      '/vehiculos',
      adminToken,
      (x) =>
        x.matricula ===
        data.vehiculo.matricula,
    );

    if (!vehicle) {
      throw new Error(
        'No se pudo recuperar el vehículo creado.',
      );
    }

    metadata.vehiculoId =
      vehicle.id;

    await cdp.navigate(
      `${baseUrl}/app/vehiculos/${vehicle.id}`,
    );

    await waitForText(
      cdp,
      `${data.vehiculo.marca} ${data.vehiculo.modelo}`,
    );

    await capture(
      cdp,
      '03-clientes-vehiculos',
      8,
      'Detalle del vehículo',
      'Ficha del vehículo con información técnica, estado, historial, imágenes y resumen económico.',
    );

    await uploadFirstFileInput(
      cdp,
      fixtureImage,
    );

    await waitForText(
      cdp,
      'Imagen cargada',
    );

    await capture(
      cdp,
      '03-clientes-vehiculos',
      9,
      'Imagen privada cargada',
      'Las fotografías nuevas quedan privadas hasta que un perfil autorizado decida publicarlas.',
    );

    await clickButton(
      cdp,
      'Publicar',
    );

    await waitForText(
      cdp,
      'Imagen publicada en el catálogo',
    );

    await capture(
      cdp,
      '03-clientes-vehiculos',
      10,
      'Imagen publicada',
      'Cambio explícito de visibilidad de una imagen para el catálogo público.',
    );

    await cdp.navigate(
      `${baseUrl}/app/compras/nueva`,
    );

    await waitForText(
      cdp,
      data.vehiculo.matricula,
    );

    await setFieldByLabel(
      cdp,
      'Vehículo',
      String(vehicle.id),
    );

    await setFieldByLabel(
      cdp,
      'Cliente vendedor',
      String(seller.id),
    );

    await setFieldByLabel(
      cdp,
      'Fecha',
      data.fecha,
    );

    await setFieldByLabel(
      cdp,
      'Costo de adquisición',
      data.compra.costo,
    );

    await setFieldByLabel(
      cdp,
      'Observaciones',
      data.compra.observaciones,
    );

    await capture(
      cdp,
      '04-compra-taller',
      1,
      'Registro de compra',
      'Compra de la unidad asociada al cliente vendedor y al costo de adquisición.',
    );

    await clickButton(
      cdp,
      'Registrar compra',
    );

    await waitForText(
      cdp,
      'Compra registrada correctamente',
    );

    await capture(
      cdp,
      '04-compra-taller',
      2,
      'Compra registrada y comprobante',
      'Confirmación de compra con acceso al comprobante PDF interno.',
    );

    await cdp.navigate(
      `${baseUrl}/app/compras`,
    );

    await waitForText(
      cdp,
      'Compras',
    );

    await capture(
      cdp,
      '04-compra-taller',
      3,
      'Historial de compras',
      'Listado administrativo de operaciones de compra registradas.',
    );

    await cdp.navigate(
      `${baseUrl}/app/vehiculos/${vehicle.id}`,
    );

    await clickButton(
      cdp,
      'EN TALLER',
    );

    await waitForText(
      cdp,
      'Estado actualizado',
    );

    await capture(
      cdp,
      '04-compra-taller',
      4,
      'Vehículo enviado a taller',
      'Cambio de estado operativo del vehículo antes de registrar trabajos.',
    );

    await clearSession(cdp);

    await loginUi(
      cdp,
      baseUrl,
      credentials.taller.username,
      credentials.taller.password,
    );

    await waitForPath(
      cdp,
      '/app',
    );

    await capture(
      cdp,
      '04-compra-taller',
      5,
      'Inicio del perfil de taller',
      'Pantalla inicial adaptada a las tareas habilitadas para el encargado de taller.',
    );

    await cdp.navigate(
      `${baseUrl}/app/taller`,
    );

    await waitForText(
      cdp,
      'Taller',
    );

    await capture(
      cdp,
      '04-compra-taller',
      6,
      'Panel de taller',
      'Listado de trabajos y acceso al registro de nuevas refacciones.',
    );

    await cdp.navigate(
      `${baseUrl}/app/taller/nueva`,
    );

    await waitForText(
      cdp,
      data.vehiculo.matricula,
    );

    await setFieldByLabel(
      cdp,
      'Vehículo',
      String(vehicle.id),
    );

    await setFieldByLabel(
      cdp,
      'Fecha',
      data.fecha,
    );

    await setFieldByLabel(
      cdp,
      'Tipo de trabajo',
      'MECANICA',
    );

    await setFieldByLabel(
      cdp,
      'Estado',
      'FINALIZADA',
    );

    await setFieldByLabel(
      cdp,
      'Costo de repuestos',
      data.refaccion.repuestos,
    );

    await setFieldByLabel(
      cdp,
      'Costo de mano de obra',
      data.refaccion.manoObra,
    );

    await setFieldByLabel(
      cdp,
      'Servicios externos',
      data.refaccion.externos,
    );

    await setFieldByLabel(
      cdp,
      'Descripción',
      data.refaccion.descripcion,
    );

    await capture(
      cdp,
      '04-compra-taller',
      7,
      'Registro de refacción',
      'Carga de un service realista diferenciando repuestos, mano de obra y servicios externos.',
    );

    await clickButton(
      cdp,
      'Guardar refacción',
    );

    await waitForPath(
      cdp,
      '/app/taller/offline',
    );

    const onlineRepair =
      await waitForServerRepair(
        tallerToken,
        vehicle.id,
        data.refaccion.descripcion,
        30_000,
      );

    metadata.refaccionId = onlineRepair.id;

    await cdp.navigate(
      `${baseUrl}/app/taller/${onlineRepair.id}?vehiculoId=${vehicle.id}`,
    );

    await waitForText(
      cdp,
      data.refaccion.descripcion,
      20_000,
    );

    await capture(
      cdp,
      '04-compra-taller',
      8,
      'Refacción registrada',
      'Trabajo guardado correctamente y confirmado en el servidor.',
    );

    await cdp.navigate(
      `${baseUrl}/app/taller/nueva`,
    );

    await waitForText(
      cdp,
      data.vehiculo.matricula,
    );

    await setOffline(
      cdp,
      true,
    );

    await waitForText(
      cdp,
      'Se guardará en este dispositivo',
    );

    await setFieldByLabel(
      cdp,
      'Vehículo',
      String(vehicle.id),
    );

    await setFieldByLabel(
      cdp,
      'Fecha',
      data.fecha,
    );

    await setFieldByLabel(
      cdp,
      'Tipo de trabajo',
      'LIMPIEZA',
    );

    await setFieldByLabel(
      cdp,
      'Estado',
      'FINALIZADA',
    );

    await setFieldByLabel(
      cdp,
      'Costo de repuestos',
      data.refaccionOffline.repuestos,
    );

    await setFieldByLabel(
      cdp,
      'Costo de mano de obra',
      data.refaccionOffline.manoObra,
    );

    await setFieldByLabel(
      cdp,
      'Servicios externos',
      data.refaccionOffline.externos,
    );

    await setFieldByLabel(
      cdp,
      'Descripción',
      data.refaccionOffline.descripcion,
    );

    await capture(
      cdp,
      '04-compra-taller',
      9,
      'Trabajo sin conexión',
      'El formulario informa claramente que la operación se guardará localmente cuando no hay conexión.',
    );

        await clickButton(
      cdp,
      'Guardar en el dispositivo',
    );

    await waitForPath(
      cdp,
      '/app/taller/offline',
    );

    const offlineBeforeSync =
      await waitForOfflineRepair(
        cdp,
        data.refaccionOffline.descripcion,
        ['pending', 'syncing', 'retry', 'synced'],
        15_000,
      );

    await capture(
      cdp,
      '04-compra-taller',
      10,
      offlineBeforeSync.status === 'synced'
        ? 'Operación sincronizada'
        : 'Operación pendiente de sincronización',
      offlineBeforeSync.status === 'synced'
        ? 'La operación quedó persistida localmente y ya fue confirmada por el servidor.'
        : 'La operación quedó almacenada localmente a la espera de sincronización.',
    );

    await setOffline(
      cdp,
      false,
    );

    await waitFor(
      () =>
        cdp.evaluate(
          'navigator.onLine === true',
        ),
      'El navegador no recuperó la conexión.',
      10_000,
      100,
    );

    await cdp.navigate(
      `${baseUrl}/app/taller/offline`,
    );

    let offlineAfterSync =
      offlineBeforeSync;

    if (
      offlineAfterSync.status !== 'synced'
    ) {
      offlineAfterSync =
        await synchronizeOfflineRepair(
          cdp,
          data.refaccionOffline.descripcion,
          90_000,
        );
    }

    const offlineServerRepair =
      await waitForServerRepair(
        tallerToken,
        vehicle.id,
        data.refaccionOffline.descripcion,
        30_000,
      );

    if (
      offlineAfterSync.serverId &&
      String(offlineAfterSync.serverId) !==
        String(offlineServerRepair.id)
    ) {
      throw new Error(
        `La confirmación local apunta al servidor ${offlineAfterSync.serverId}, pero la API devolvió ${offlineServerRepair.id}.`,
      );
    }

    metadata.refaccionOfflineId =
      offlineServerRepair.id;

    await cdp.navigate(
      `${baseUrl}/app/taller/offline`,
    );
    
    await waitForText(
      cdp,
      'Registrada correctamente',
      20_000,
    );

    await waitForText(
      cdp,
      data.refaccionOffline.descripcion,
      20_000,
    );

    await capture(
      cdp,
      '04-compra-taller',
      11,
      'Sincronización recuperada',
      'La operación guardada localmente quedó confirmada por el servidor al recuperar conectividad.',
    );

    await cdp.navigate(
      `${baseUrl}/app/vehiculos/${vehicle.id}`,
    );

    await clickButton(
      cdp,
      'DISPONIBLE',
    );

    await waitForText(
      cdp,
      'Estado actualizado',
    );

    await capture(
      cdp,
      '04-compra-taller',
      12,
      'Vehículo disponible',
      'Unidad habilitada para continuar con el proceso comercial luego de finalizar los trabajos.',
    );

    await clearSession(cdp);

    await loginUi(
      cdp,
      baseUrl,
      credentials.vendedor.username,
      credentials.vendedor.password,
    );

    await waitForPath(
      cdp,
      '/app',
    );

    await capture(
      cdp,
      '05-venta-catalogo',
      1,
      'Inicio del perfil vendedor',
      'Accesos principales disponibles para un usuario comercial.',
    );

    await cdp.navigate(
      `${baseUrl}/app/vehiculos/${vehicle.id}`,
    );

    await clickButton(
      cdp,
      'Publicar en catálogo',
    );

    await waitForText(
      cdp,
      'Publicación actualizada',
    );

    await capture(
      cdp,
      '05-venta-catalogo',
      2,
      'Publicación del vehículo',
      'Acción que habilita una unidad disponible para aparecer en el catálogo público.',
    );

    await clearSession(cdp);

    await cdp.navigate(
      `${baseUrl}/catalogo`,
    );

    await waitForText(
      cdp,
      `${data.vehiculo.marca} ${data.vehiculo.modelo}`,
      20_000,
    );

    await capture(
      cdp,
      '05-venta-catalogo',
      3,
      'Catálogo público',
      'Vista pública del stock disponible con filtros y ordenamiento.',
    );

    await cdp.navigate(
      `${baseUrl}/catalogo/${vehicle.id}`,
    );

    await waitForText(
      cdp,
      `${data.vehiculo.marca} ${data.vehiculo.modelo}`,
    );

    await capture(
      cdp,
      '05-venta-catalogo',
      4,
      'Detalle público del Toyota Camry',
      'Ficha comercial pública sin exponer datos internos de costos o clientes.',
    );

    await clickAria(
      cdp,
      'Abrir asistente',
    );

    await setInputBySelector(
      cdp,
      '#chatbot-question',
      '¿Cuál es el horario de atención y cómo puedo comunicarme?',
    );

    await clickAria(
      cdp,
      'Enviar consulta',
    );

    await waitFor(
      () =>
        cdp.evaluate(
          `document.querySelectorAll('.chat-msg--bot').length >= 2 && !document.body.innerText.includes('Escribiendo…')`,
        ),
      'El asistente no respondió a tiempo.',
      20_000,
      150,
    );

    await capture(
      cdp,
      '05-venta-catalogo',
      5,
      'Asistente de consultas',
      'Ejemplo de consulta general realizada desde el catálogo público.',
    );

    await loginUi(
      cdp,
      baseUrl,
      credentials.vendedor.username,
      credentials.vendedor.password,
    );

    await cdp.navigate(
      `${baseUrl}/app/ventas/nueva`,
    );

    await waitForText(
      cdp,
      data.vehiculo.matricula,
    );

    await setFieldByLabel(
      cdp,
      'Vehículo',
      String(vehicle.id),
    );

    await setFieldByLabel(
      cdp,
      'Cliente comprador',
      String(buyer.id),
    );

    await setFieldByLabel(
      cdp,
      'Fecha',
      data.fecha,
    );

    await setFieldByLabel(
      cdp,
      'Precio final',
      data.venta.precio,
    );

    await setFieldByLabel(
      cdp,
      'Observaciones',
      data.venta.observaciones,
    );

    await capture(
      cdp,
      '05-venta-catalogo',
      6,
      'Registro de venta',
      'Venta asociada al cliente comprador, vehículo y precio final acordado.',
    );

    await clickButton(
      cdp,
      'Cerrar venta',
    );

    await waitForText(
      cdp,
      'Venta #',
      20_000,
    );

    await capture(
      cdp,
      '05-venta-catalogo',
      7,
      'Venta registrada',
      'Detalle final de la venta con rentabilidad y acceso al comprobante.',
    );

    const sale = await findBy(
      '/ventas',
      vendedorToken,
      (x) =>
        x.vehiculoId === vehicle.id ||
        String(x.vehiculo || '').includes(
          data.vehiculo.modelo,
        ),
    );

    if (!sale) {
      throw new Error(
        'No se pudo recuperar la venta creada.',
      );
    }

    metadata.ventaId =
      sale.id;

    await cdp.navigate(
      `${baseUrl}/app/ventas`,
    );

    await waitForText(
      cdp,
      'Ventas',
    );

    await capture(
      cdp,
      '05-venta-catalogo',
      8,
      'Historial de ventas',
      'Listado de ventas registradas y acceso a sus detalles.',
    );

    await clearSession(cdp);

    await loginUi(
      cdp,
      baseUrl,
      credentials.admin.username,
      credentials.admin.password,
    );

    await cdp.navigate(
      `${baseUrl}/app/costos`,
    );

    await waitForText(
      cdp,
      'Costos y rentabilidad',
    );

    await capture(
      cdp,
      '06-gestion-reportes',
      1,
      'Costos y rentabilidad',
      'Resumen económico por vehículo utilizando compra, refacciones y venta registrada.',
    );

    await cdp.navigate(
      `${baseUrl}/app/reportes`,
    );

    await waitForText(
      cdp,
      'Reportes de gestión',
    );

    await setFieldByLabel(
      cdp,
      'Reporte',
      'ventas',
    );

    await setFieldByLabel(
      cdp,
      'Desde',
      data.fecha,
    );

    await setFieldByLabel(
      cdp,
      'Hasta',
      data.fecha,
    );

    await clickButton(
      cdp,
      'Consultar período',
    );

    await waitForText(
      cdp,
      `${data.vehiculo.marca} ${data.vehiculo.modelo}`,
      20_000,
    );

    await capture(
      cdp,
      '06-gestion-reportes',
      2,
      'Reporte de ventas por período',
      'Consulta acotada por fechas con indicadores y detalle de operaciones.',
    );

    await setFieldByLabel(
      cdp,
      'Reporte',
      'rentabilidad',
    );

    await clickButton(
      cdp,
      'Consultar período',
    );

    await waitForText(
      cdp,
      'Rentabilidad',
      20_000,
    );

    await capture(
      cdp,
      '06-gestion-reportes',
      3,
      'Reporte de rentabilidad',
      'Reporte gerencial de rentabilidad calculada sobre las operaciones del período.',
    );

    await cdp.navigate(
      `${baseUrl}/app/auditoria`,
    );

    await waitForText(
      cdp,
      'Auditoría',
    );

    await capture(
      cdp,
      '06-gestion-reportes',
      4,
      'Auditoría',
      'Registro de acciones relevantes para conocer qué ocurrió, cuándo y sobre qué entidad.',
    );

    await cdp.navigate(
      `${baseUrl}/app/dashboard`,
    );

    await waitForText(
      cdp,
      'Dashboard gerencial',
    );

    await capture(
      cdp,
      '06-gestion-reportes',
      5,
      'Dashboard luego del ciclo completo',
      'Indicadores gerenciales luego de completar compra, taller, publicación y venta de la unidad.',
    );

    await clearSession(cdp);

    await loginUi(
      cdp,
      baseUrl,
      credentials.taller.username,
      credentials.taller.password,
    );

    await cdp.navigate(
      `${baseUrl}/app/reportes`,
    );

    await waitForPath(
      cdp,
      '/app',
    );

    await capture(
      cdp,
      '07-permisos-sesion',
      1,
      'Acceso restringido por rol',
      'Un perfil de taller no puede acceder a reportes gerenciales y es redirigido a su área habilitada.',
    );

    await cdp.navigate(
      `${baseUrl}/app/mi-cuenta/password`,
    );

    await waitForText(
      cdp,
      'Cambiar mi contraseña',
    );

    await capture(
      cdp,
      '07-permisos-sesion',
      2,
      'Cambio de contraseña',
      'Pantalla de autoservicio para actualizar la contraseña de la cuenta autenticada.',
    );

    metadata.completedAt =
      new Date().toISOString();

    metadata.captureCount =
      manifest.length;

    await writeManifest(
      evidenceDir,
      metadata,
      manifest,
      logLines,
    );

    log(
      'Suite de evidencia para manual',
      'PASS',
      `${manifest.length} capturas PNG generadas en ${evidenceDir}`,
    );
  } catch (error) {
    log(
      'Suite de evidencia para manual',
      'FAIL',
      error.message,
    );

    metadata.failedAt =
      new Date().toISOString();

    metadata.failure = {
      message: error.message,
      stack: error.stack,
    };

    await writeManifest(
      evidenceDir,
      metadata,
      manifest,
      logLines,
    );

    throw error;
  } finally {
    await browser?.close();
  }
}

await main();