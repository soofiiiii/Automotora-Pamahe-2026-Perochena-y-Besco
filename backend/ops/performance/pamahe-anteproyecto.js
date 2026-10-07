import http from 'k6/http';
import { check, sleep } from 'k6';

// Perfil de aceptación fijo: no reducir usuarios ni relajar umbrales para certificar O-06.
const base = (__ENV.BASE_URL || 'http://localhost:8080/api').replace(/\/$/, '');
const token = __ENV.TOKEN;
if (!token || !__ENV.DATASET_FILE) throw new Error('TOKEN gerencial y DATASET_FILE son obligatorios');
const dataset = JSON.parse(open(__ENV.DATASET_FILE));
if (!dataset.id || !dataset.counts || dataset.counts.vehiculos < 41 || dataset.counts.ventas < 21) {
  throw new Error('Registrar un dataset representativo: >=41 vehículos y >=21 ventas');
}
export const options = {
  scenarios: {
    warmup: { executor: 'constant-vus', vus: 5, duration: '30s', gracefulStop: '0s', exec: 'lecturas' },
    measure: { executor: 'constant-vus', vus: 50, duration: '3m', startTime: '35s', gracefulStop: '10s', exec: 'lecturas' },
  },
  thresholds: {
    'http_req_failed{scenario:measure}': ['rate<0.01'],
    'checks{scenario:measure}': ['rate>0.99'],
    'http_req_duration{scenario:measure,scope:interno}': ['p(95)<300'],
    'http_req_duration{scenario:measure,endpoint:stock}': ['p(95)<300'],
    'http_req_duration{scenario:measure,endpoint:dashboard}': ['p(95)<300'],
    'http_req_duration{scenario:measure,endpoint:ventas}': ['p(95)<300'],
    'http_reqs{scenario:measure,endpoint:stock}': ['count>=50'],
    'http_reqs{scenario:measure,endpoint:dashboard}': ['count>=50'],
    'http_reqs{scenario:measure,endpoint:ventas}': ['count>=50'],
  },
};
function request(path, endpoint, scope = 'interno') {
  const response = http.get(base + path, { headers: { Authorization: `Bearer ${token}` },
    tags: { endpoint, scope, name: endpoint }, timeout: '10s', redirects: 0 });
  check(response, { [`${endpoint}: 200`]: r => r.status === 200,
    [`${endpoint}: contrato JSON`]: r => { try { return r.json().data != null; } catch (_) { return false; } } });
}
export function setup() {
  const r = http.get(base + '/reportes/dashboard', { headers: { Authorization: `Bearer ${token}` }, redirects: 0 });
  if (r.status !== 200) throw new Error('Se requiere sesión vigente gerencial sin rotación pendiente; 403 no es éxito');
}
export function lecturas() {
  // Rotación determinista entre páginas del volumen declarado, con tamaño constante.
  const page = (__VU + __ITER) % Math.ceil(dataset.counts.vehiculos / 20);
  request(`/vehiculos/paginado?page=${page}&size=20`, 'stock');
  request('/reportes/dashboard', 'dashboard');
  request('/ventas/paginado?page=0&size=20', 'ventas');
  request('/catalogo/vehiculos/paginado?page=0&size=20', 'catalogo', 'publico');
  sleep(1);
}
export function handleSummary(data) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return { [`anteproyecto-${stamp}.json`]: JSON.stringify({
    run: { at: stamp, profile: 'lecturas-50-vus', dataset, baseUrl: base, vus: 50 }, results: data,
  }, null, 2), stdout: 'Perfil de lecturas finalizado; revisar thresholds y el JSON fechado. No mide LCP ni escrituras.\n' };
}
