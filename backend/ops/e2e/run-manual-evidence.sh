#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
ROOT_DIR="$(cd "$BACKEND_DIR/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
EVIDENCE_ROOT="$ROOT_DIR/evidencia/manual-usuario"
INFRA_DIR="$EVIDENCE_ROOT/_infra"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.e2e.yml"
BACKEND_PID=""; FRONTEND_PID=""
mkdir -p "$INFRA_DIR"
cleanup() {
  set +e
  [[ -n "$FRONTEND_PID" ]] && kill "$FRONTEND_PID" >/dev/null 2>&1
  [[ -n "$BACKEND_PID" ]] && kill "$BACKEND_PID" >/dev/null 2>&1
  docker compose -f "$COMPOSE_FILE" down -v --remove-orphans >>"$INFRA_DIR/docker-compose.log" 2>&1
}
trap cleanup EXIT INT TERM

echo "[1/5] MySQL E2E aislado"
docker compose -f "$COMPOSE_FILE" down -v --remove-orphans >>"$INFRA_DIR/docker-compose.log" 2>&1 || true
docker compose -f "$COMPOSE_FILE" up -d >>"$INFRA_DIR/docker-compose.log" 2>&1
for _ in $(seq 1 60); do docker exec pamahe_mysql_e2e mysqladmin ping -h 127.0.0.1 -uroot -ppamahe_e2e_root_2026 --silent >/dev/null 2>&1 && break; sleep 1; done

echo "[2/5] Backend E2E"
(cd "$BACKEND_DIR" && SPRING_PROFILES_ACTIVE=e2e SPRING_CONFIG_ADDITIONAL_LOCATION=file:./ops/e2e/application-e2e.yml ./mvnw spring-boot:run) >"$INFRA_DIR/backend-console.log" 2>&1 & BACKEND_PID=$!
for _ in $(seq 1 120); do curl -fsS http://127.0.0.1:18080/api/actuator/health >/dev/null 2>&1 && break; sleep 1; done

echo "[3/5] Frontend"
cd "$FRONTEND_DIR"
[[ -d node_modules ]] || npm ci >"$INFRA_DIR/npm-ci.log" 2>&1
VITE_API_URL=http://127.0.0.1:18080/api npm run build >"$INFRA_DIR/frontend-build.log" 2>&1
npm run preview -- --host 127.0.0.1 --port 15173 --strictPort >"$INFRA_DIR/frontend-preview.log" 2>&1 & FRONTEND_PID=$!
for _ in $(seq 1 60); do curl -fsS http://127.0.0.1:15173 >/dev/null 2>&1 && break; sleep 1; done

echo "[4/5] Evidencia del manual"
PAMAHE_MANUAL_BASE_URL=http://127.0.0.1:15173 PAMAHE_MANUAL_API_URL=http://127.0.0.1:18080/api node e2e/manual/manual-evidence.mjs 2>&1 | tee "$INFRA_DIR/manual-runner.log"
echo "[5/5] Evidencia disponible en $EVIDENCE_ROOT"
