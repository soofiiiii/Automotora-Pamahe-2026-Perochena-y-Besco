#!/usr/bin/env bash
set -euo pipefail
umask 077
source "$(dirname "$0")/common.sh"

: "${DB_HOST:?DB_HOST requerido}"
: "${DB_PORT:=3306}"
: "${DB_NAME:?DB_NAME requerido}"
: "${DB_USER:?DB_USER requerido}"
: "${DB_PASSWORD:?DB_PASSWORD requerido}"
: "${BACKUP_DIR:=/var/backups/pamahe/mysql}"
: "${BACKUP_RETENTION_DAYS:=14}"
: "${BACKUP_LOCK_FILE:=${BACKUP_DIR}/.backup.lock}"

validate_connection
validate_database "$DB_NAME"
[[ "$BACKUP_RETENTION_DAYS" =~ ^[0-9]{1,4}$ ]] && (( 10#$BACKUP_RETENTION_DAYS >= 1 )) || exit 2
: "${BACKUP_REQUIRE_REMOTE:=true}"
[[ "$BACKUP_REQUIRE_REMOTE" == true || "$BACKUP_REQUIRE_REMOTE" == false ]] || exit 2
if [[ "$BACKUP_REQUIRE_REMOTE" == true && -z "${BACKUP_REMOTE:-}" ]]; then
  echo 'BACKUP_REMOTE requerido para una copia fuera del host; usar false solo en pruebas locales' >&2
  exit 2
fi
if [[ -n "${BACKUP_REMOTE:-}" ]]; then
  [[ "$BACKUP_REMOTE" =~ ^[A-Za-z0-9_.-]+@[A-Za-z0-9.-]+:/[A-Za-z0-9_./-]+$ ]] || { echo 'Destino remoto inválido' >&2; exit 2; }
fi
mkdir -p "$BACKUP_DIR"
exec 9>"$BACKUP_LOCK_FILE"
if ! flock -n 9; then
  echo "Ya existe un backup de Pamahe en ejecución." >&2
  exit 10
fi

ts="$(date -u +%Y%m%dT%H%M%SZ)"
base="${DB_NAME}_${ts}_$$"
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

# Solo se aplica retención después de completar la copia externa solicitada.
if [[ -n "${BACKUP_REMOTE:-}" ]]; then
  rsync --protect-args -e 'ssh -o BatchMode=yes -o StrictHostKeyChecking=yes' \
    -- "$final" "$checksum" "$BACKUP_REMOTE/"
fi
find "$BACKUP_DIR" -maxdepth 1 -type f \( -name "${DB_NAME}_*.sql.gz" -o -name "${DB_NAME}_*.sql.gz.sha256" \) \
  -mtime "+$BACKUP_RETENTION_DAYS" -delete
printf 'Backup completado: %s; copia remota=%s\n' "$final" "${BACKUP_REMOTE:-no solicitada (prueba local)}"
