#!/usr/bin/env python3
"""Valida tres ensayos de ventas y LCP real; cualquier evidencia incompleta falla."""
import argparse
import json
import math
from pathlib import Path
import sys


def require(condition, message):
    if not condition:
        raise ValueError(message)


def metric(metrics, name, key):
    value = metrics.get(name, {}).get('values', {}).get(key)
    require(isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value),
            f'MÃ©trica ausente/invÃ¡lida: {name}.{key}')
    return value


def check_summary(path, kind):
    data = json.loads(path.read_text(encoding='utf-8-sig'))
    metrics = data['results']['metrics']
    flags = [t.get('ok') for m in metrics.values() for t in m.get('thresholds', {}).values()]
    require(flags and all(flag is True for flag in flags), f'{path.name}: thresholds fallidos/ausentes')
    if kind == 'ventas':
        require(data.get('profile') == 'ventas-50-vus', 'Perfil de ventas incorrecto')
        p95 = metric(metrics, 'http_req_duration{endpoint:venta-crear}', 'p(95)')
        require(0 < p95 < 1500, f'Ventas p95={p95} ms; exige <1500')
        require(metric(metrics, 'http_reqs{endpoint:venta-crear}', 'count') == 50, 'Faltan las 50 ventas')
        failure = 'http_req_failed{phase:measure}' if 'http_req_failed{phase:measure}' in metrics else 'http_req_failed'
        checks = 'checks{phase:measure}' if 'checks{phase:measure}' in metrics else 'checks'
        require(metric(metrics, failure, 'rate') < .01, 'Errores de ventas >=1%')
        require(metric(metrics, checks, 'rate') > .99, 'Checks de ventas <=99%')
        require(metric(metrics, checks, 'passes') == 50 and metric(metrics, checks, 'fails') == 0, 'Se requieren 50 ventas confirmadas')
    else:
        p95 = metric(metrics, 'browser_web_vital_lcp', 'p(95)')
        require(0 < p95 < 2000, f'LCP p95={p95} ms; exige <2000')
        require(metric(metrics, 'iterations', 'count') == 10, 'Faltan 10 navegaciones')
        require(metric(metrics, 'checks', 'passes') == 10 and metric(metrics, 'checks', 'fails') == 0, 'CatÃ¡logo no renderizado 10 veces')
        require(bool(data.get('url')) and bool(data.get('readySelector')), 'Falta URL/selector del catÃ¡logo')
    return data, p95


def check_lcp_raw(path, expected_url):
    samples = []
    with path.open(encoding='utf-8-sig') as stream:
        for line in stream:
            item = json.loads(line)
            if item.get('type') == 'Point' and item.get('metric') == 'browser_web_vital_lcp':
                point = item['data']
                require(point.get('tags', {}).get('url') == expected_url, 'LCP corresponde a otra URL; usar la URL final del catÃ¡logo')
                value = point.get('value')
                require(isinstance(value, (int, float)) and math.isfinite(value) and value > 0, 'Muestra LCP invÃ¡lida')
                samples.append(value)
    require(len(samples) == 10, f'Solo {len(samples)} muestras LCP; se exigen 10')
    samples.sort()
    position = .95 * (len(samples) - 1)
    low = int(position)
    p95 = samples[low] + (samples[low + 1] - samples[low]) * (position - low)
    require(p95 < 2000, f'LCP raw p95={p95} ms; exige <2000')
    return p95


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--sales', nargs=3, type=Path, required=True)
    parser.add_argument('--lcp', type=Path, required=True)
    parser.add_argument('--lcp-raw', type=Path, required=True)
    args = parser.parse_args()
    try:
        require(len({p.resolve() for p in args.sales}) == 3, 'Se requieren tres archivos de ensayos distintos')
        require(len({p.read_bytes() for p in args.sales}) == 3, 'No se admite copiar un ensayo tres veces')
        runs = [check_summary(p, 'ventas')[0] for p in args.sales]
        require(len({r.get('warmupSales', 0) for r in runs}) == 1, 'No mezclar ensayos frÃ­os/calientes')
        lcp, p95 = check_summary(args.lcp, 'lcp')
        raw_p95 = check_lcp_raw(args.lcp_raw, lcp['url'])
        require(math.isclose(p95, raw_p95, rel_tol=1e-6, abs_tol=.01), 'El raw LCP no coincide con el resumen')
        print('PASS ventas (3 ensayos) y LCP. Revisar tambiÃ©n lecturas, dataset, equipo/configuraciÃ³n y logs antes de cerrar BE-12.')
        return 0
    except (OSError, ValueError, KeyError, TypeError) as exc:
        print(f'FAIL BE-12: {exc}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())

