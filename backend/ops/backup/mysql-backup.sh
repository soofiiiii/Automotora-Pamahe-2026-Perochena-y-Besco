#!/usr/bin/env bash
set -euo pipefail
umask 077

: "${DB_HOST:?DB_HOST requerido}"
: "${DB_PORT:=3306}"
: "${DB_NAME:?DB_NAME requerido}"
: "${DB_USER:?DB_USER requerido}"
: "${DB_PASSWORD:?DB_PASSWORD requerido}"
: "${BACKUP_DIR:=/var/backups/pamahe/mysql}"
: "${BACKUP_RETENTION_DAYS:=14}"
: "${BACKUP_LOCK_FILE:=${BACKUP_DIR}/.backup.lock}"

mkdir -p "$BACKUP_DIR"
exec 9>"$BACKUP_LOCK_FILE"
if ! flock -n 9; then
  echo "Ya existe un backup de Pamahe en ejecución." >&2
  exit 10
fi

ts="$(date -u +%Y%m%dT%H%M%SZ)"
base="${DB_NAME}_${ts}"
partial="$BACKUP_DIR/${base}.sql.gz.part"
final="$BACKUP_DIR/${base}.sql.gz"
checksum="$final.sha256"

cleanup() {
  rm -f "$partial"
}
trap cleanup EXIT

MYSQL_PWD="$DB_PASSWORD" mysqldump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --user="$DB_USER" \
  --single-transaction \
  --quick \
  --hex-blob \
  --routines \
  --triggers \
  --events \
  --default-character-set=utf8mb4 \
  --set-gtid-purged=OFF \
  --no-tablespaces \
  "$DB_NAME" | gzip -9 > "$partial"

gzip -t "$partial"
mv "$partial" "$final"
(
  cd "$BACKUP_DIR"
  sha256sum "$(basename "$final")" > "$(basename "$checksum")"
)

find "$BACKUP_DIR" -type f \( -name '*.sql.gz' -o -name '*.sql.gz.sha256' \) \
  -mtime "+$BACKUP_RETENTION_DAYS" -delete

printf 'Backup creado y verificado: %s\n' "$final"
