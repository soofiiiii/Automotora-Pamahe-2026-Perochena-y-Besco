#!/usr/bin/env bash
set -euo pipefail
umask 077

: "${PAMAHE_API_HOST:?PAMAHE_API_HOST es obligatorio}"
: "${PAMAHE_BACKEND_PORT:=8080}"
: "${TLS_CERTIFICATE:?TLS_CERTIFICATE es obligatorio}"
: "${TLS_CERTIFICATE_KEY:?TLS_CERTIFICATE_KEY es obligatorio}"
: "${NGINX_TEMPLATE:=/opt/pamahe/backend/ops/nginx/pamahe.conf.template}"
: "${NGINX_TARGET:=/etc/nginx/conf.d/pamahe.conf}"

case "$PAMAHE_BACKEND_PORT" in
  ''|*[!0-9]*) echo "PAMAHE_BACKEND_PORT debe ser numérico" >&2; exit 2 ;;
esac

if [[ ! -r "$TLS_CERTIFICATE" || ! -r "$TLS_CERTIFICATE_KEY" ]]; then
  echo "Los archivos TLS configurados no existen o no son legibles." >&2
  exit 3
fi

export PAMAHE_API_HOST PAMAHE_BACKEND_PORT TLS_CERTIFICATE TLS_CERTIFICATE_KEY

envsubst '${PAMAHE_API_HOST} ${PAMAHE_BACKEND_PORT} ${TLS_CERTIFICATE} ${TLS_CERTIFICATE_KEY}' \
  < "$NGINX_TEMPLATE" > "${NGINX_TARGET}.tmp"
mv "${NGINX_TARGET}.tmp" "$NGINX_TARGET"

printf 'Configuración Nginx renderizada en %s\n' "$NGINX_TARGET"
