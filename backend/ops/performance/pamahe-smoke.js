import http from 'k6/http';
import { check, sleep } from 'k6';

const internalLimitMs = Number(__ENV.INTERNAL_P95_MS || 2000);
const catalogLimitMs = Number(__ENV.CATALOG_P95_MS || 3000);

export const options = {
  vus: Number(__ENV.VUS || 25),
  duration: __ENV.DURATION || '60s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{scope:catalogo}': [`p(95)<${catalogLimitMs}`],
    'http_req_duration{scope:interno}': [`p(95)<${internalLimitMs}`],
    checks: ['rate>0.99'],
  },
};

const base = (__ENV.BASE_URL || 'http://localhost:8080/api').replace(/\/$/, '');
const token = __ENV.TOKEN || '';

export default function () {
  const catalogo = http.get(
    `${base}/catalogo/vehiculos/paginado?page=0&size=20`,
    { tags: { scope: 'catalogo', endpoint: 'catalogo-paginado' } },
  );
  check(catalogo, {
    'catálogo responde 200': (r) => r.status === 200,
    'catálogo devuelve JSON': (r) => String(r.headers['Content-Type'] || '').includes('application/json'),
  });

  if (token) {
    const params = {
      headers: { Authorization: `Bearer ${token}` },
      tags: { scope: 'interno' },
    };

    const stock = http.get(`${base}/vehiculos/paginado?page=0&size=20`, {
      ...params,
      tags: { scope: 'interno', endpoint: 'vehiculos-paginado' },
    });
    check(stock, { 'stock responde 200': (r) => r.status === 200 });

    const dashboard = http.get(`${base}/reportes/dashboard`, {
      ...params,
      tags: { scope: 'interno', endpoint: 'dashboard' },
    });
    check(dashboard, { 'dashboard responde 200 o 403 por rol': (r) => r.status === 200 || r.status === 403 });
  }

  sleep(Number(__ENV.SLEEP_SECONDS || 1));
}

export function handleSummary(data) {
  const resultFile = __ENV.RESULT_FILE || 'pamahe-performance-summary.json';
  return {
    [resultFile]: JSON.stringify(data, null, 2),
    stdout: `Resumen de rendimiento guardado en ${resultFile}\n`,
  };
}
