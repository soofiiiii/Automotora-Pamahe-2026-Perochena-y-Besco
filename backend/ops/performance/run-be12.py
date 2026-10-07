#!/usr/bin/env python3
"""Ejecuta k6 con evidencia aislada. No modifica ni restaura la base de datos."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import platform
import subprocess
import sys
import threading
import urllib.request

HERE = Path(__file__).resolve().parent


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('profile', choices=['ventas', 'lcp'])
    parser.add_argument('--fixtures', type=Path)
    parser.add_argument('--warmup-fixtures', type=Path)
    parser.add_argument('--label', required=True, help='Equipo, JVM, DB, pool, build y red utilizados; sin secretos')
    parser.add_argument('--output', type=Path, default=HERE / 'results')
    args = parser.parse_args()
    env = os.environ.copy()
    if args.profile == 'ventas':
        if not args.fixtures or not args.fixtures.is_file():
            parser.error('--fixtures debe existir')
        if env.get('ALLOW_WRITES') != 'TEST_DATABASE' or not env.get('TOKEN'):
            parser.error('Definir ALLOW_WRITES=TEST_DATABASE y TOKEN en el entorno')
        env['FIXTURES_FILE'] = args.fixtures.resolve().as_posix()
        env.pop('WARMUP_FIXTURES_FILE', None)
        if args.warmup_fixtures:
            if not args.warmup_fixtures.is_file():
                parser.error('--warmup-fixtures debe existir')
            env['WARMUP_FIXTURES_FILE'] = args.warmup_fixtures.resolve().as_posix()
    elif not env.get('CATALOG_URL') or not env.get('READY_SELECTOR'):
        parser.error('Definir CATALOG_URL y READY_SELECTOR del frontend real')
    # Un identificador distinto por ensayo enlaza las 50 solicitudes con los logs del backend.
    run_id = 'be12-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    dest = args.output.resolve() / run_id
    dest.mkdir(parents=True, exist_ok=False)
    env['RUN_ID'] = run_id
    env['RESULTS_DIR'] = dest.as_posix()
    script = HERE / ('pamahe-transactions.js' if args.profile == 'ventas' else 'catalogo-lcp.js')
    metadata = {'runId': run_id, 'profile': args.profile, 'label': args.label,
                'generatorPlatform': platform.platform(), 'scriptSha256': hashlib.sha256(script.read_bytes()).hexdigest(),
                'warmupSales': 0, 'fixturesSha256': None}
    if args.fixtures:
        metadata['fixturesSha256'] = hashlib.sha256(args.fixtures.read_bytes()).hexdigest()
    if args.warmup_fixtures:
        metadata['warmupSales'] = len(json.loads(args.warmup_fixtures.read_text(encoding='utf-8-sig')))
        metadata['warmupFixturesSha256'] = hashlib.sha256(args.warmup_fixtures.read_bytes()).hexdigest()
        
    stop = threading.Event()
    def monitor():
        url = env.get('PROMETHEUS_URL')
        if not url:
            return
        with (dest / 'pool.ndjson').open('w', encoding='utf-8') as output:
            while not stop.is_set():
                try:
                    request = urllib.request.Request(url, headers={'X-Monitoring-Token': env.get('MONITORING_SCRAPE_TOKEN', '')})
                    with urllib.request.urlopen(request, timeout=2) as response:
                        lines = response.read().decode().splitlines()
                    selected = [line for line in lines if line.startswith(('hikaricp_', 'jdbc_connections_'))]
                    record = {'time': datetime.now(timezone.utc).isoformat(), 'metrics': selected}
                except Exception as exc:
                    record = {'time': datetime.now(timezone.utc).isoformat(), 'errorType': type(exc).__name__}
                output.write(json.dumps(record) + '\n'); output.flush()
                stop.wait(0.5)
    thread = threading.Thread(target=monitor, daemon=True)
    try:
        metadata['k6Version'] = subprocess.check_output(['k6', 'version'], text=True).strip()
        thread.start()
        with (dest / 'console.log').open('w', encoding='utf-8') as log:
            result = subprocess.run(['k6', 'run', '--out', 'json=' + (dest / 'raw.ndjson').as_posix(), str(script)],
                                    env=env, stdout=log, stderr=subprocess.STDOUT, check=False)
        metadata['exitCode'] = result.returncode
    except OSError as exc:
        metadata['exitCode'] = 127
        metadata['errorType'] = type(exc).__name__
    finally:
        stop.set()
        if thread.is_alive():
            thread.join(timeout=3)
        (dest / 'metadata.json').write_text(json.dumps(metadata, indent=2), encoding='utf-8')
    print(f"Evidencia: {dest}\nSalida k6: {metadata['exitCode']}; BE-12 exige ventas y LCP aprobados.")
    return metadata['exitCode']


if __name__ == '__main__':
    sys.exit(main())
