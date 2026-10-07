#!/usr/bin/env python3
"""Resume evidencia reproducible de CQ-01 y CQ-02 desde target/."""
from __future__ import annotations

import csv
import json
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

CRITICAL_PACKAGES = (
    "uy.edu.ctc.pamahe.modules.vehiculos.service",
    "uy.edu.ctc.pamahe.modules.compras.service",
    "uy.edu.ctc.pamahe.modules.ventas.service",
    "uy.edu.ctc.pamahe.modules.costos.service",
    "uy.edu.ctc.pamahe.modules.taller.service",
    "uy.edu.ctc.pamahe.modules.reportes.service",
)
CQ02_SUITE = "uy.edu.ctc.pamahe.integration.RefaccionOfflineConcurrencyMySqlIntegrationTest"


def suite_totals(report_dir: Path) -> dict[str, int]:
    total = {"tests": 0, "failures": 0, "errors": 0, "skipped": 0, "suites": 0}
    for path in sorted(report_dir.glob("TEST-*.xml")):
        root = ET.parse(path).getroot()
        total["suites"] += 1
        for key in ("tests", "failures", "errors", "skipped"):
            total[key] += int(root.attrib.get(key, "0"))
    return total


def cq02_totals(report_dir: Path) -> dict[str, int | str | bool]:
    path = report_dir / f"TEST-{CQ02_SUITE}.xml"
    if not path.exists():
        return {"present": False, "suite": CQ02_SUITE}
    root = ET.parse(path).getroot()
    return {
        "present": True,
        "suite": CQ02_SUITE,
        "tests": int(root.attrib.get("tests", "0")),
        "failures": int(root.attrib.get("failures", "0")),
        "errors": int(root.attrib.get("errors", "0")),
        "skipped": int(root.attrib.get("skipped", "0")),
    }


def jacoco_critical(csv_path: Path) -> list[dict[str, object]]:
    if not csv_path.exists():
        return []
    aggregate: dict[str, list[int]] = {package: [0, 0] for package in CRITICAL_PACKAGES}
    with csv_path.open(encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            package = row.get("PACKAGE", "")
            if package in aggregate:
                aggregate[package][0] += int(row["LINE_MISSED"])
                aggregate[package][1] += int(row["LINE_COVERED"])
    result = []
    for package, (missed, covered) in aggregate.items():
        total = missed + covered
        ratio = covered / total if total else 0.0
        result.append({
            "package": package,
            "line_missed": missed,
            "line_covered": covered,
            "line_ratio": round(ratio, 6),
            "passes_80_percent": ratio >= 0.80,
        })
    return result


def pmd_violations(pmd_xml: Path) -> dict[str, object]:
    if not pmd_xml.exists():
        return {"present": False, "violations": None}
    root = ET.parse(pmd_xml).getroot()
    violations = [element for element in root.iter() if element.tag.rsplit("}", 1)[-1] == "violation"]
    return {"present": True, "violations": len(violations)}


def render_markdown(data: dict[str, object]) -> str:
    suite = data["surefire"]
    cq02 = data["cq02"]
    lines = [
        "# Resumen de evidencia CQ-01 / CQ-02",
        "",
        "## CQ-01 - suite backend",
        f"- Suites: {suite['suites']}",
        f"- Tests: {suite['tests']}",
        f"- Failures: {suite['failures']}",
        f"- Errors: {suite['errors']}",
        f"- Skipped: {suite['skipped']}",
        f"- PMD violations: {data['pmd']['violations'] if data['pmd']['present'] else 'sin reporte'}",
        "",
        "### Cobertura LINE de paquetes críticos",
    ]
    for row in data["jacoco_critical"]:
        lines.append(f"- {row['package']}: {row['line_ratio']:.2%}")
    lines.extend([
        "",
        "## CQ-02 - concurrencia MySQL",
        f"- Reporte presente: {cq02['present']}",
    ])
    if cq02["present"]:
        lines.extend([
            f"- Tests: {cq02['tests']}",
            f"- Failures: {cq02['failures']}",
            f"- Errors: {cq02['errors']}",
            f"- Skipped: {cq02['skipped']}",
        ])
    return "\n".join(lines) + "\n"


def main() -> int:
    if len(sys.argv) != 3:
        print("Uso: extract-cq-evidence.py <backend-root> <output-dir>", file=sys.stderr)
        return 2
    backend = Path(sys.argv[1]).resolve()
    output = Path(sys.argv[2]).resolve()
    output.mkdir(parents=True, exist_ok=True)
    target = backend / "target"
    data = {
        "surefire": suite_totals(target / "surefire-reports"),
        "cq02": cq02_totals(target / "surefire-reports"),
        "jacoco_critical": jacoco_critical(target / "site" / "jacoco" / "jacoco.csv"),
        "pmd": pmd_violations(target / "pmd.xml"),
    }
    (output / "evidence-summary.json").write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (output / "evidence-summary.md").write_text(render_markdown(data), encoding="utf-8")

    suite = data["surefire"]
    cq02 = data["cq02"]
    coverage_ok = bool(data["jacoco_critical"]) and all(
        row["passes_80_percent"] for row in data["jacoco_critical"])
    pmd_ok = data["pmd"]["present"] and data["pmd"]["violations"] == 0
    cq02_ok = (
        cq02["present"]
        and cq02["tests"] >= 10
        and cq02["failures"] == 0
        and cq02["errors"] == 0
        and cq02["skipped"] == 0
    )
    suite_ok = suite["tests"] > 0 and suite["failures"] == 0 and suite["errors"] == 0
    return 0 if suite_ok and coverage_ok and pmd_ok and cq02_ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
