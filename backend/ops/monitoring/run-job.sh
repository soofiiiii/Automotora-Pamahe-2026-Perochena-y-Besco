#!/usr/bin/env bash
set -euo pipefail
umask 027
job="${1:?Uso: run-job.sh backup|restore_verify comando argumentos...}"
shift
[[ "$job" == backup || "$job" == restore_verify ]] || exit 2
[[ "$#" -gt 0 ]] || exit 2
: "${TEXTFILE_DIR:=/var/lib/node_exporter/textfile_collector}"
[[ -d "$TEXTFILE_DIR" && -w "$TEXTFILE_DIR" ]] || { echo 'Directorio de métricas no disponible' >&2; exit 2; }
exec 9>"$TEXTFILE_DIR/.${job}.lock"
flock -n 9 || exit 10
file="$TEXTFILE_DIR/pamahe_${job}.prom"
previous=0
if [[ -f "$file" ]]; then
  previous=$(awk '/^pamahe_job_last_success_timestamp_seconds/ {print $2}' "$file")
  [[ "$previous" =~ ^[0-9]+$ ]] || previous=0
fi
if "$@"; then result=0; else result=$?; fi
now=$(date +%s)
[[ "$result" -ne 0 ]] || previous="$now"
temporary=$(mktemp "$file.XXXXXX")
trap 'rm -f "$temporary"' EXIT
{
  printf 'pamahe_job_last_exit_code{job_name="%s"} %s\n' "$job" "$result"
  printf 'pamahe_job_last_run_timestamp_seconds{job_name="%s"} %s\n' "$job" "$now"
  printf 'pamahe_job_last_success_timestamp_seconds{job_name="%s"} %s\n' "$job" "$previous"
} > "$temporary"
chmod 640 "$temporary"
mv "$temporary" "$file"
exit "$result"
