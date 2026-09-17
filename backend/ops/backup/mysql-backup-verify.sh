#!/usr/bin/env bash
set -euo pipefail
umask 077

backup="${1:?Uso: mysql-backup-verify.sh archivo.sql.gz}"
: "${DB_HOST:?DB_HOST requerido}"
: "${DB_PORT:=3306}"
: "${DB_USER:?DB_USER requerido}"
: "${DB_PASSWORD:?DB_PASSWORD requerido}"
: "${VERIFY_DB_PREFIX:=pamahe_restore_verify}"

timestamp="$(date -u +%Y%m%d%H%M%S)"
verify_db="${VERIFY_DB_PREFIX}_${timestamp}_$$"

cleanup() {
  MYSQL_PWD="$DB_PASSWORD" mysql --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USER" \
    -e "DROP DATABASE IF EXISTS \`${verify_db}\`;" >/dev/null 2>&1 || true
}
trap cleanup EXIT

[[ -f "$backup" ]] || { echo "No existe el backup: $backup" >&2; exit 2; }
[[ -f "$backup.sha256" ]] || { echo "Falta el checksum: $backup.sha256" >&2; exit 3; }
(
  cd "$(dirname "$backup")"
  sha256sum -c "$(basename "$backup").sha256"
)
gzip -t "$backup"

MYSQL_PWD="$DB_PASSWORD" mysql --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USER" \
  -e "CREATE DATABASE \`${verify_db}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"

gunzip -c "$backup" | MYSQL_PWD="$DB_PASSWORD" mysql \
  --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USER" "$verify_db"

DB_NAME="$verify_db" "$(dirname "$0")/mysql-verify-restore.sh"
printf 'Backup restaurado y verificado correctamente en base temporal %s.\n' "$verify_db"
