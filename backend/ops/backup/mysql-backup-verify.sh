#!/usr/bin/env bash
set -euo pipefail
umask 077
source "$(dirname "$0")/common.sh"

backup="${1:?Uso: mysql-backup-verify.sh archivo.sql.gz}"
: "${DB_HOST:?DB_HOST requerido}"
: "${DB_PORT:=3306}"
: "${DB_USER:?DB_USER requerido}"
: "${DB_PASSWORD:?DB_PASSWORD requerido}"
: "${VERIFY_DB_PREFIX:=pamahe_restore_verify}"

validate_connection
validate_database "$VERIFY_DB_PREFIX"
validate_backup "$backup"
created=false
timestamp="$(date -u +%Y%m%d%H%M%S)"
verify_db="${VERIFY_DB_PREFIX}_${timestamp}_$$"
validate_database "$verify_db"

cleanup() {
  local result=$?
  trap - EXIT
  if [[ "$created" == true ]]; then
    if ! MYSQL_PWD="$DB_PASSWORD" mysql --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USER" \
      -e "DROP DATABASE IF EXISTS \`${verify_db}\`;"; then
      echo "No se pudo eliminar la base temporal $verify_db; requiere intervención." >&2
      (( result != 0 )) || result=33
    fi
  fi
  exit "$result"
}
trap cleanup EXIT

MYSQL_PWD="$DB_PASSWORD" mysql --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USER" \
  -e "CREATE DATABASE \`${verify_db}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"

created=true

gunzip -c -- "$backup" | MYSQL_PWD="$DB_PASSWORD" mysql \
  --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USER" "$verify_db"

DB_NAME="$verify_db" bash "$(dirname "$0")/mysql-verify-restore.sh"
printf 'Integridad verificada en %s; eliminando base temporal al finalizar.\n' "$verify_db"
