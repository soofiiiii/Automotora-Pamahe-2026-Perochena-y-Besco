import http from 'k6/http';
import { check, sleep } from 'k6';

// Solo para una copia desechable de la base: cada fila se vende una vez.
if (__ENV.ALLOW_WRITES !== 'TEST_DATABASE' || !__ENV.TOKEN || !__ENV.FIXTURES_FILE) {
  throw new Error('Requiere ALLOW_WRITES=TEST_DATABASE, TOKEN y FIXTURES_FILE');
}

const fixtures = JSON.parse(open(__ENV.FIXTURES_FILE));

if (
  !Array.isArray(fixtures)
  || fixtures.length !== 50
  || new Set(fixtures.map(f => f.vehiculoId)).size !== 50
) {
  throw new Error(
    'Se requieren exactamente 50 vehículos distintos, con compra activa y disponibles para venta',
  );
}

const warmup = __ENV.WARMUP_FIXTURES_FILE
  ? JSON.parse(open(__ENV.WARMUP_FIXTURES_FILE))
  : [];

if (
  __ENV.WARMUP_FIXTURES_FILE
  && (
    !Array.isArray(warmup)
    || warmup.length < 50
    || new Set(warmup.map(f => f.vehiculoId)).size !== warmup.length
    || warmup.some(w => fixtures.some(f => f.vehiculoId === w.vehiculoId))
  )
) {
  throw new Error(
    'Warmup requiere al menos 50 vehículos distintos y separados de los 50 medidos',
  );
}

const runId = __ENV.RUN_ID || `be12-${Date.now()}`;

if (!/^[A-Za-z0-9._-]{1,60}$/.test(runId)) {
  throw new Error('RUN_ID inválido');
}

const base = (__ENV.BASE_URL || 'http://localhost:8080/api').replace(/\/$/, '');

const proximoMantenimientoDefault = new Date(
  Date.now() + 30 * 24 * 60 * 60 * 1000,
)
  .toISOString()
  .slice(0, 10);

/**
 * Completa los fixtures históricos con el contrato actual de VentaRequest.
 * Los valores expresamente incluidos en el fixture tienen prioridad.
 */
function buildVentaPayload(fixture) {
  return {
    ...fixture,

    medioPago:
      fixture.medioPago !== undefined
        ? fixture.medioPago
        : 'TRANSFERENCIA',

    entidadFinanciera:
      fixture.entidadFinanciera !== undefined
        ? fixture.entidadFinanciera
        : null,

    montoFinanciado:
      fixture.montoFinanciado !== undefined
        ? fixture.montoFinanciado
        : null,

    estadoFinanciacion:
      fixture.estadoFinanciacion !== undefined
        ? fixture.estadoFinanciacion
        : null,

    canalOrigen:
      fixture.canalOrigen !== undefined
        ? fixture.canalOrigen
        : 'PRESENCIAL',

    datosCompradorVerificados:
      fixture.datosCompradorVerificados !== undefined
        ? fixture.datosCompradorVerificados
        : true,

    documentacionRevisada:
      fixture.documentacionRevisada !== undefined
        ? fixture.documentacionRevisada
        : true,

    cobroConfirmado:
      fixture.cobroConfirmado !== undefined
        ? fixture.cobroConfirmado
        : true,

    proximoMantenimiento:
      fixture.proximoMantenimiento !== undefined
        ? fixture.proximoMantenimiento
        : proximoMantenimientoDefault,

    observaciones:
      fixture.observaciones !== undefined
        ? fixture.observaciones
        : 'Prueba de rendimiento CP-PERF-01',
  };
}

export const options = {
  setupTimeout: '5m',

  scenarios: {
    ventas: {
      executor: 'per-vu-iterations',
      vus: 50,
      iterations: 1,
      maxDuration: '2m',
    },
  },

  thresholds: {
    'http_req_failed{phase:measure}': ['rate<0.01'],
    'checks{phase:measure}': ['rate>0.99'],
    'http_req_duration{endpoint:venta-crear}': ['p(95)<1500'],
    'http_reqs{endpoint:venta-crear}': ['count==50'],
  },
};

export function setup() {
  for (let i = 0; i < warmup.length; i++) {
    const payload = buildVentaPayload(warmup[i]);

    const r = http.post(
      base + '/ventas',
      JSON.stringify(payload),
      {
        headers: {
          Authorization: `Bearer ${__ENV.TOKEN}`,
          'Content-Type': 'application/json',
          'X-Correlation-Id': `${runId}-warmup-${i}`,
        },
        tags: {
          phase: 'warmup',
          endpoint: 'venta-warmup',
          name: 'venta-warmup',
        },
        timeout: '30s',
        redirects: 0,
      },
    );

    let valid = false;

    try {
      valid = r.status === 200 && r.json().data.id > 0;
    } catch (_) {
      // Fail below.
    }

    if (!valid) {
      throw new Error(
        `Warmup falló en fila ${i}; status=${r.status}; body=${r.body}`,
      );
    }
  }

  if (warmup.length) {
    sleep(5);
  }
}

export default function () {
  const fixture = fixtures[__VU - 1];
  const payload = buildVentaPayload(fixture);

  const r = http.post(
    base + '/ventas',
    JSON.stringify(payload),
    {
      headers: {
        Authorization: `Bearer ${__ENV.TOKEN}`,
        'Content-Type': 'application/json',
        'X-Correlation-Id': `${runId}-measure-${__VU}`,
      },
      tags: {
        phase: 'measure',
        scope: 'interno',
        endpoint: 'venta-crear',
        name: 'venta-crear',
      },
      timeout: '30s',
      redirects: 0,
    },
  );

  const valid = check(
    r,
    {
      'venta confirmada': response => {
        try {
          return response.status === 200 && response.json().data.id > 0;
        } catch (_) {
          return false;
        }
      },
    },
    {
      phase: 'measure',
    },
  );

  if (!valid) {
    console.error(
      `Venta VU ${__VU} rechazada: status=${r.status}; body=${r.body}`,
    );
  }
}

export function handleSummary(data) {
  const stamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-');

  return {
    [`${__ENV.RESULTS_DIR || '.'}/ventas-${stamp}.json`]:
      JSON.stringify(
        {
          profile: 'ventas-50-vus',
          runId,
          warmupSales: warmup.length,
          measuredVus: 50,
          results: data,
        },
        null,
        2,
      ),

    stdout:
      '50 ventas de ensayo: conservar salida y restaurar el dataset antes de repetir.\n',
  };
}