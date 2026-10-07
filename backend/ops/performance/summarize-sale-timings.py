#!/usr/bin/env python3
"""Extrae solo los tiempos BE12 de un ensayo; no copia el resto del log."""
import argparse
import json
from pathlib import Path
import re

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('log', type=Path)
parser.add_argument('--run-id', required=True)
args = parser.parse_args()
rows = []
pattern = re.compile(r'BE12 venta status=(\d+) total_ms=([\d.Ee+-]+) etapas_ms=\{([^}]*)\}')
with args.log.open(encoding='utf-8', errors='replace') as stream:
    for line in stream:
        if not re.search(r'correlationId=' + re.escape(args.run_id) + r'-measure-\d+\s', line):
            continue
        match = pattern.search(line)
        if match:
            stages = {k: float(v) for k, v in (pair.strip().split('=') for pair in match[3].split(','))}
            rows.append({'status': int(match[1]), 'total_ms': float(match[2]), **stages})

def stats(values):
    values = sorted(values); pos = .95 * (len(values) - 1); low = int(pos)
    return {'count': len(values), 'avg': sum(values) / len(values), 'max': values[-1],
            'p95': values[low] + (values[min(low + 1, len(values) - 1)] - values[low]) * (pos - low)}

result = {'runId': args.run_id, 'requests': len(rows),
          'successfulRequests': sum(r['status'] == 200 for r in rows), 'stages_ms': {}}
for key in sorted({k for row in rows for k in row if k != 'status'}):
    result['stages_ms'][key] = stats([r[key] for r in rows if key in r])
print(json.dumps(result, indent=2))
raise SystemExit(0 if len(rows) == 50 and result['successfulRequests'] == 50 else 1)
