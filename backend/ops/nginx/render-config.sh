#!/usr/bin/env bash
set -euo pipefail
umask 077

: "${PAMAHE_API_HOST:?Dominio API requerido}"
: "${PAMAHE_BACKEND_PORT:=8080}"
: "${TLS_CERTIFICATE:?Ruta de certificado requerida}"
: "${TLS_CERTIFICATE_KEY:?Ruta de clave requerida}"
: "${NGINX_TEMPLATE:=$(dirname "$0")/pamahe.conf.template}"
: "${NGINX_TARGET:?Archivo de salida requerido; revisar antes de instalar en Nginx}"

[[ "$PAMAHE_API_HOST" =~ ^[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?$ && "$PAMAHE_API_HOST" != *..* ]] || { echo 'Dominio inválido' >&2; exit 2; }
[[ "$PAMAHE_BACKEND_PORT" =~ ^[0-9]{1,5}$ ]] || exit 2
(( 10#$PAMAHE_BACKEND_PORT >= 1 && 10#$PAMAHE_BACKEND_PORT <= 65535 )) || exit 2

for tls_path in "$TLS_CERTIFICATE" "$TLS_CERTIFICATE_KEY"; do
  [[ "$tls_path" =~ ^/[A-Za-z0-9_./-]+$ && -r "$tls_path" ]] || { echo 'Ruta TLS inválida o no legible' >&2; exit 3; }
done

command -v envsubst >/dev/null
export PAMAHE_API_HOST PAMAHE_BACKEND_PORT TLS_CERTIFICATE TLS_CERTIFICATE_KEY

temporary=$(mktemp "${NGINX_TARGET}.XXXXXX")
trap 'rm -f "$temporary"' EXIT

envsubst '${PAMAHE_API_HOST} ${PAMAHE_BACKEND_PORT} ${TLS_CERTIFICATE} ${TLS_CERTIFICATE_KEY}' < "$NGINX_TEMPLATE" > "$temporary"
mv "$temporary" "$NGINX_TARGET"

printf 'Configuración preparada: %s. Validar con nginx -t antes de recargar.\n' "$NGINX_TARGET"
