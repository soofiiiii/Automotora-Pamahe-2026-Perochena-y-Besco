#!/usr/bin/env bash
set -euo pipefail
umask 077

backup="${1:?Uso: mysql-restore.sh archivo.sql.gz}"
: "${DB_HOST:?DB_HOST requerido}"
: "${DB_PORT:=3306}"
: "${DB_NAME:?DB_NAME requerido}"
: "${DB_USER:?DB_USER requerido}"
: "${DB_PASSWORD:?DB_PASSWORD requerido}"
: "${RESTORE_CONFIRM:=NO}"

if [[ "$RESTORE_CONFIRM" != "YES" ]]; then
  echo "Restauración cancelada. Defina RESTORE_CONFIRM=YES para confirmar la sobrescritura de $DB_NAME." >&2
  exit 20
fi

[[ -f "$backup" ]] || { echo "No existe el backup: $backup" >&2; exit 2; }
[[ -f "$backup.sha256" ]] || { echo "Falta el checksum: $backup.sha256" >&2; exit 3; }

(
  cd "$(dirname "$backup")"
  sha256sum -c "$(basename "$backup").sha256"
)
gzip -t "$backup"

gunzip -c "$backup" | MYSQL_PWD="$DB_PASSWORD" mysql \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --user="$DB_USER" \
  --default-character-set=utf8mb4 \
  "$DB_NAME"

printf 'Restauración finalizada en %s. Ejecute mysql-verify-restore.sh para validar integridad.\n' "$DB_NAME"
