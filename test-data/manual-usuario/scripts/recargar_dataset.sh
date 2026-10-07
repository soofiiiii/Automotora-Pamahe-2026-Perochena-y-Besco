#!/usr/bin/env bash
set -euo pipefail
PROJECT_ROOT="${1:-.}"
PACKAGE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SQL="$PACKAGE_ROOT/sql/pamahe_dataset_manual_completo.sql"
"$PACKAGE_ROOT/scripts/preparar_media_prueba.sh" "$PROJECT_ROOT"
docker cp "$SQL" pamahe_mysql:/tmp/pamahe_dataset_manual_completo.sql
docker exec pamahe_mysql sh -c 'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < /tmp/pamahe_dataset_manual_completo.sql'
docker exec pamahe_mysql sh -c 'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e "SELECT COUNT(*) AS usuarios FROM usuarios; SELECT COUNT(*) AS vehiculos FROM vehiculos; SELECT COUNT(*) AS publicados FROM vehiculos WHERE activo=1 AND publicado=1; SELECT COUNT(*) AS ventas FROM ventas;"'
echo "Dataset Pamahe recargado correctamente."
