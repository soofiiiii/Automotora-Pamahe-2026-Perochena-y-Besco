#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
REPO_ROOT="$(cd "$BACKEND_ROOT/.." && pwd)"
EVIDENCE_ROOT="${1:-$REPO_ROOT/evidencia}"
STAMP="$(date +%Y%m%d-%H%M%S)"
CQ01="$EVIDENCE_ROOT/CQ-01/$STAMP"
CQ02="$EVIDENCE_ROOT/CQ-02/$STAMP"
mkdir -p "$CQ01" "$CQ02"

ENV_LOG="$CQ01/environment.log"
{
  echo "timestamp=$STAMP"
  echo "backend=$BACKEND_ROOT"
  echo "--- java ---"
  java -version 2>&1 || true
  echo "--- docker ---"
  docker --version 2>&1 || true
  docker info 2>&1 || true
  echo "--- maven wrapper ---"
  (cd "$BACKEND_ROOT" && sh mvnw -v) 2>&1 || true
} > "$ENV_LOG"

if ! command -v docker >/dev/null 2>&1 || ! docker info >/dev/null 2>&1; then
  echo "CQ-01/CQ-02 requieren Docker operativo porque clean verify incluye Testcontainers/MySQL." | tee "$CQ02/docker-required.log"
  exit 2
fi

VERIFY_LOG="$CQ01/maven-clean-verify.log"
set +e
(cd "$BACKEND_ROOT" && sh mvnw clean verify) 2>&1 | tee "$VERIFY_LOG"
MVN_STATUS=${PIPESTATUS[0]}
set -e

if [ -d "$BACKEND_ROOT/target/surefire-reports" ]; then
  cp -R "$BACKEND_ROOT/target/surefire-reports" "$CQ01/surefire-reports"
  CQ02_XML="$BACKEND_ROOT/target/surefire-reports/TEST-uy.edu.ctc.pamahe.integration.RefaccionOfflineConcurrencyMySqlIntegrationTest.xml"
  CQ02_TXT="$BACKEND_ROOT/target/surefire-reports/uy.edu.ctc.pamahe.integration.RefaccionOfflineConcurrencyMySqlIntegrationTest.txt"
  [ -f "$CQ02_XML" ] && cp "$CQ02_XML" "$CQ02/"
  [ -f "$CQ02_TXT" ] && cp "$CQ02_TXT" "$CQ02/"
fi
[ -d "$BACKEND_ROOT/target/site/jacoco" ] && cp -R "$BACKEND_ROOT/target/site/jacoco" "$CQ01/jacoco"
[ -f "$BACKEND_ROOT/target/pmd.xml" ] && cp "$BACKEND_ROOT/target/pmd.xml" "$CQ01/"
[ -f "$BACKEND_ROOT/target/site/pmd.html" ] && cp "$BACKEND_ROOT/target/site/pmd.html" "$CQ01/"

SUMMARY_DIR="$EVIDENCE_ROOT/resumen/$STAMP"
mkdir -p "$SUMMARY_DIR"
set +e
python3 "$SCRIPT_DIR/extract-cq-evidence.py" "$BACKEND_ROOT" "$SUMMARY_DIR"
SUMMARY_STATUS=$?
set -e

(
  cd "$EVIDENCE_ROOT"
  find . -type f -print0 | sort -z | xargs -0 sha256sum > "$SUMMARY_DIR/sha256.txt"
)

if [ "$MVN_STATUS" -ne 0 ]; then
  exit "$MVN_STATUS"
fi
exit "$SUMMARY_STATUS"
