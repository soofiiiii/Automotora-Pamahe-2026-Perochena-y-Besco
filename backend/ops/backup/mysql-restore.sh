#!/usr/bin/env bash
set -euo pipefail
umask 077
source "$(dirname "$0")/common.sh"

backup="${1:?Uso: mysql-restore.sh archivo.sql.gz}"
: "${DB_HOST:?DB_HOST requerido}"
: "${DB_PORT:=3306}"
: "${DB_NAME:?DB_NAME requerido}"
: "${DB_USER:?DB_USER requerido}"
: "${DB_PASSWORD:?DB_PASSWORD requerido}"
: "${RESTORE_CONFIRM:=NO}"

validate_connection
validate_database "$DB_NAME"
if [[ "$RESTORE_CONFIRM" != "YES" || "${RESTORE_TARGET:-}" != "$DB_NAME" ]]; then
  echo "Restauración cancelada. Defina RESTORE_CONFIRM=YES y RESTORE_TARGET igual al nombre de base para confirmar la sobrescritura de $DB_NAME." >&2
  exit 20
fi

validate_backup "$backup"

gunzip -c -- "$backup" | MYSQL_PWD="$DB_PASSWORD" mysql \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --user="$DB_USER" \
  --default-character-set=utf8mb4 \
  "$DB_NAME"

bash "$(dirname "$0")/mysql-verify-restore.sh"

printf 'Restauración e integridad verificadas en %s.\n' "$DB_NAME"
