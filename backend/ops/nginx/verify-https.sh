#!/usr/bin/env bash

set -euo pipefail

# 1 Validación de variables de entorno
: "${PAMAHE_API_HOST:?Dominio API requerido}"
: "${FRONTEND_URL:?Origen HTTPS del frontend requerido}"
: "${PAMAHE_BACKEND_PORT:=8080}"

# 2. Configuración de directorio temporal y limpieza al salir
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

url="https://${PAMAHE_API_HOST}/api/actuator/health"

# prueba 1: Healthcheck HTTPS
# Sin -k: se valida cadena de confianza y nombre del certificado.
status=$(curl --silent --show-error --max-time 20 \
    -D "$tmp/headers" \
    -o "$tmp/body" \
    -w '%{http_code}' \
    "$url")

[[ "$status" == "200" ]] || { 
    echo "Error: Health HTTPS devolvió $status" >&2
    exit 1 
}

# prueba 2: Cabecera HSTS
grep -iq '^strict-transport-security:' "$tmp/headers"

# prueba 3: Redirección HTTP a HTTPS
status=$(curl --silent --show-error --max-time 20 \
    -D "$tmp/redirect" \
    -o /dev/null \
    -w '%{http_code}' \
    "http://${PAMAHE_API_HOST}/api/actuator/health")

[[ "$status" == "308" ]]
grep -Fiq "location: https://${PAMAHE_API_HOST}/api/actuator/health" "$tmp/redirect"

# prueba 4: Configuración CORS
curl --silent --show-error --fail --max-time 20 -X OPTIONS \
    -D "$tmp/cors" \
    -o /dev/null \
    -H "Origin: $FRONTEND_URL" \
    -H 'Access-Control-Request-Method: POST' \
    "https://${PAMAHE_API_HOST}/api/auth/login"

grep -Fiq "access-control-allow-origin: $FRONTEND_URL" "$tmp/cors"

# prueba 5: Rechazo de acceso directo HTTP 
status=$(curl --silent --show-error --max-time 5 \
    -o /dev/null \
    -w '%{http_code}' \
    "http://127.0.0.1:${PAMAHE_BACKEND_PORT}/api/actuator/health")

[[ "$status" == "426" ]] || { 
    echo "Error: Acceso directo HTTP: se esperaba 426, llegó $status" >&2
    exit 1 
}

# éxito
printf 'PASS HTTPS, HSTS, redirección, CORS y rechazo HTTP directo: %s\n' "$(date -u +%FT%TZ)"