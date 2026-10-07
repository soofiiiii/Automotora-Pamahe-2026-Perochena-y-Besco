#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
ROOT_DIR="$(cd "$BACKEND_DIR/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
EVIDENCE_DIR="$ROOT_DIR/evidencia"
CQ03_DIR="$EVIDENCE_DIR/CQ-03"
CQ04_DIR="$EVIDENCE_DIR/CQ-04"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.e2e.yml"
BACKEND_PID=""
FRONTEND_PID=""

mkdir -p "$CQ03_DIR" "$CQ04_DIR"

cleanup() {
  set +e
  [[ -n "$FRONTEND_PID" ]] && kill "$FRONTEND_PID" >/dev/null 2>&1
  [[ -n "$BACKEND_PID" ]] && kill "$BACKEND_PID" >/dev/null 2>&1
  docker compose -f "$COMPOSE_FILE" down -v --remove-orphans >>"$CQ03_DIR/docker-compose.log" 2>&1
}
trap cleanup EXIT INT TERM

{
  echo "run_started=$(date -Iseconds)"
  echo "git_commit=$(git -C "$ROOT_DIR" rev-parse HEAD 2>/dev/null || echo unavailable)"
  java -version 2>&1 | head -n 1
  node --version
  npm --version
  docker --version
  docker compose version
} >"$EVIDENCE_DIR/environment.txt"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker es obligatorio para CQ-03." >&2
  exit 2
fi

echo "[1/8] MySQL 8.4 aislado"
docker compose -f "$COMPOSE_FILE" down -v --remove-orphans >>"$CQ03_DIR/docker-compose.log" 2>&1 || true
docker compose -f "$COMPOSE_FILE" up -d >>"$CQ03_DIR/docker-compose.log" 2>&1
for _ in $(seq 1 60); do
  if docker exec pamahe_mysql_e2e mysqladmin ping -h 127.0.0.1 -uroot -ppamahe_e2e_root_2026 --silent >/dev/null 2>&1; then break; fi
  sleep 1
done
docker exec pamahe_mysql_e2e mysqladmin ping -h 127.0.0.1 -uroot -ppamahe_e2e_root_2026 --silent >/dev/null

echo "[2/8] Backend real + Flyway"
(
  cd "$BACKEND_DIR"
  export SPRING_PROFILES_ACTIVE=e2e
  export SPRING_CONFIG_ADDITIONAL_LOCATION="file:./ops/e2e/application-e2e.yml"
  ./mvnw spring-boot:run
) >"$CQ03_DIR/backend-console.log" 2>&1 &
BACKEND_PID=$!
for _ in $(seq 1 120); do
  if curl -fsS http://127.0.0.1:18080/api/actuator/health >/dev/null 2>&1; then break; fi
  sleep 1
done
curl -fsS http://127.0.0.1:18080/api/actuator/health >"$CQ03_DIR/backend-health.json"

echo "[3/8] Frontend limpio apuntando al backend real"
cd "$FRONTEND_DIR"
if [[ ! -d node_modules ]]; then npm ci >"$CQ03_DIR/npm-ci.log" 2>&1; fi
VITE_API_URL=http://127.0.0.1:18080/api npm run build >"$CQ03_DIR/frontend-build.log" 2>&1
npm run preview -- --host 127.0.0.1 --port 15173 --strictPort >"$CQ03_DIR/frontend-preview.log" 2>&1 &
FRONTEND_PID=$!
for _ in $(seq 1 60); do
  if curl -fsS http://127.0.0.1:15173 >/dev/null 2>&1; then break; fi
  sleep 1
done
curl -fsS http://127.0.0.1:15173 >/dev/null

echo "[4/8] CQ-03 E2E real FE -> BE -> MySQL"
PAMAHE_CQ03_EVIDENCE_DIR="$CQ03_DIR" node e2e/real-stack-flow.mjs 2>&1 | tee "$CQ03_DIR/runner-console.log"

echo "[5/8] CQ-04 validación estática existente"
PAMAHE_ACCESSIBILITY_STATIC_ONLY=1 node e2e/accessibility-validation.mjs --static 2>&1 | tee "$CQ04_DIR/static-accessibility.log"
cp -f evidencias/accesibilidad/resultado-estatico.json "$CQ04_DIR/resultado-estatico.json"

echo "[6/8] CQ-04 axe-core 4.13.0 + teclado"
PAMAHE_CQ03_EVIDENCE_DIR="$CQ03_DIR" PAMAHE_CQ04_EVIDENCE_DIR="$CQ04_DIR" \
  npm exec --yes --package=axe-core@4.13.0 -- node e2e/axe-standard-validation.mjs 2>&1 | tee "$CQ04_DIR/axe-console.log"

echo "[7/8] CQ-04 Lighthouse 13.5.0"
PAMAHE_CQ03_EVIDENCE_DIR="$CQ03_DIR" PAMAHE_CQ04_EVIDENCE_DIR="$CQ04_DIR" \
  node e2e/lighthouse-accessibility.mjs 2>&1 | tee "$CQ04_DIR/lighthouse-console.log"

echo "[8/8] Hashes y cierre"
(
  cd "$EVIDENCE_DIR"
  find . -type f ! -name SHA256SUMS.txt -print0 | sort -z | xargs -0 sha256sum > SHA256SUMS.txt
)
echo "CQ-03 y CQ-04 ejecutados correctamente. Evidencia: $EVIDENCE_DIR"
