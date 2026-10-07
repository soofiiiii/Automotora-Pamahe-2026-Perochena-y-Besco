#!/usr/bin/env bash
set -euo pipefail
: "${BACKUP_DIR:?BACKUP_DIR requerido}"
: "${DB_NAME:?DB_NAME requerido}"
source "$(dirname "$0")/common.sh"
validate_database "$DB_NAME"
latest=''
while IFS= read -r -d '' path; do latest="$path"; done < <(find "$BACKUP_DIR" -maxdepth 1 -type f -name "${DB_NAME}_*.sql.gz" -print0 | sort -z)
[[ -n "$latest" ]] || { echo 'No hay backup para verificar' >&2; exit 4; }
exec bash "$(dirname "$0")/mysql-backup-verify.sh" "$latest"
