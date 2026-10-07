#!/usr/bin/env python3
"""Comprueba el XML JaCoCo de una ejecución limpia, sin aceptar paquetes ausentes."""
from pathlib import Path
import sys
import xml.etree.ElementTree as ET

CRITICAL_PACKAGES = tuple(
    f"uy/edu/ctc/pamahe/modules/{module}/service"
    for module in ("vehiculos", "compras", "ventas", "costos", "taller", "reportes")
)


def main() -> int:
    report = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("target/site/jacoco/jacoco.xml")
    try:
        root = ET.parse(report).getroot()
    except (OSError, ET.ParseError) as error:
        print(f"No hay un informe JaCoCo legible: {report}: {error}", file=sys.stderr)
        return 1
    packages = {p.attrib["name"]: p for p in root.findall("package")}
    failed = False
    for name in CRITICAL_PACKAGES:
        package = packages.get(name)
        counter = None if package is None else package.find("counter[@type='LINE']")
        if counter is None:
            print(f"FAIL {name}: paquete o contador LINE ausente")
            failed = True
            continue
        covered = int(counter.attrib["covered"])
        missed = int(counter.attrib["missed"])
        total = covered + missed
        # Comparación entera: un 79,995 % no debe pasar por redondearse a 80,00 %.
        passed = total > 0 and covered * 100 >= total * 80
        percent = 100 * covered / total if total else 0
        print(f"{'PASS' if passed else 'FAIL'} {name}: {covered}/{total} líneas ({percent:.2f} %)")
        failed |= not passed
    return int(failed)


if __name__ == "__main__":
    raise SystemExit(main())
