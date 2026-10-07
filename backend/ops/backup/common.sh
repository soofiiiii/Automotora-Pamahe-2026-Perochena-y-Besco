#!/usr/bin/env bash
# Compartido por los scripts de backup, no carga archivos con secretos como código.
set -euo pipefail
umask 077
validate_connection() {
  : "${DB_HOST:?DB_HOST requerido}"
  : "${DB_PORT:=3306}"
  : "${DB_USER:?DB_USER requerido}"
  : "${DB_PASSWORD:?DB_PASSWORD requerido}"
  [[ "$DB_PORT" =~ ^[0-9]{1,5}$ ]] && (( 10#$DB_PORT > 0 && 10#$DB_PORT <= 65535 )) || { echo 'Puerto MySQL inválido' >&2; exit 2; }
}
validate_database() {
  [[ "$1" =~ ^[A-Za-z][A-Za-z0-9_]{0,63}$ ]] || { echo 'Nombre de base inválido' >&2; exit 2; }
}
validate_backup() {
  [[ -f "$1" && -f "$1.sha256" ]] || { echo 'Backup o checksum ausente' >&2; exit 3; }
  # Verifica el digest del archivo solicitado, sin seguir nombres ajenos del sidecar.
  local digest actual
  read -r digest _ < "$1.sha256"
  [[ "$digest" =~ ^[a-fA-F0-9]{64}$ ]] || { echo 'Checksum inválido' >&2; exit 3; }
  actual=$(sha256sum -- "$1"); actual=${actual%% *}
  [[ "${digest,,}" == "$actual" ]] || { echo 'Checksum no coincide' >&2; exit 3; }
  gzip -t -- "$1"
}
