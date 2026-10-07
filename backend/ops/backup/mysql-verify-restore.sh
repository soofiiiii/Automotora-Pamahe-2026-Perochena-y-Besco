#!/usr/bin/env bash
set -euo pipefail
umask 077
source "$(dirname "$0")/common.sh"

: "${DB_HOST:?DB_HOST requerido}"
: "${DB_PORT:=3306}"
: "${DB_NAME:?DB_NAME requerido}"
: "${DB_USER:?DB_USER requerido}"
: "${DB_PASSWORD:?DB_PASSWORD requerido}"

validate_connection
validate_database "$DB_NAME"

mysql_cmd=(mysql --batch --skip-column-names --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USER" "$DB_NAME")

run_scalar() {
  MYSQL_PWD="$DB_PASSWORD" "${mysql_cmd[@]}" -e "$1"
}

required_tables=(roles usuarios usuarios_roles clientes vehiculos compras refacciones ventas imagenes_vehiculo auditoria parametros refaccion_operaciones_offline flyway_schema_history)
for table in "${required_tables[@]}"; do
  exists="$(run_scalar "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = '${table}';")"
  if [[ "$exists" != "1" ]]; then
    echo "Falta la tabla obligatoria: $table" >&2
    exit 30
  fi
done

checks=(
  "SELECT COUNT(*) FROM ventas WHERE costo_total_al_vender <> costo_compra_al_vender + costo_refacciones_al_vender OR rentabilidad_calculada <> precio_final - costo_total_al_vender;"
  "SELECT COUNT(*) FROM ventas ve JOIN compras c ON c.vehiculo_id=ve.vehiculo_id WHERE ve.activo=1 AND c.activo=1 AND ve.fecha_venta < c.fecha_compra;"
  "SELECT COUNT(*) FROM refaccion_operaciones_offline o LEFT JOIN refacciones r ON r.id=o.refaccion_id WHERE o.refaccion_id IS NOT NULL AND (r.id IS NULL OR NOT(r.id_operacion_offline <=> o.id_operacion));"
  "SELECT COUNT(*) FROM (SELECT vehiculo_id FROM imagenes_vehiculo WHERE activo=1 AND principal=1 GROUP BY vehiculo_id HAVING COUNT(*) > 1) x;"

  "SELECT COUNT(*) FROM compras c LEFT JOIN vehiculos v ON v.id=c.vehiculo_id WHERE v.id IS NULL;"
  "SELECT COUNT(*) FROM compras c LEFT JOIN clientes cl ON cl.id=c.cliente_vendedor_id WHERE cl.id IS NULL;"
  "SELECT COUNT(*) FROM compras c LEFT JOIN usuarios u ON u.id=c.usuario_responsable_id WHERE u.id IS NULL;"
  "SELECT COUNT(*) FROM ventas ve LEFT JOIN vehiculos v ON v.id=ve.vehiculo_id WHERE v.id IS NULL;"
  "SELECT COUNT(*) FROM ventas ve LEFT JOIN clientes cl ON cl.id=ve.cliente_comprador_id WHERE cl.id IS NULL;"
  "SELECT COUNT(*) FROM ventas ve LEFT JOIN usuarios u ON u.id=ve.vendedor_id WHERE u.id IS NULL;"
  "SELECT COUNT(*) FROM refacciones r LEFT JOIN vehiculos v ON v.id=r.vehiculo_id WHERE v.id IS NULL;"
  "SELECT COUNT(*) FROM refacciones r LEFT JOIN usuarios u ON u.id=r.usuario_registra_id WHERE u.id IS NULL;"
  "SELECT COUNT(*) FROM usuarios_roles ur LEFT JOIN usuarios u ON u.id=ur.usuario_id LEFT JOIN roles r ON r.id=ur.rol_id WHERE u.id IS NULL OR r.id IS NULL;"
  "SELECT COUNT(*) FROM imagenes_vehiculo i LEFT JOIN vehiculos v ON v.id=i.vehiculo_id WHERE v.id IS NULL;"
  "SELECT COUNT(*) FROM vehiculos v LEFT JOIN parametros p ON p.categoria='TIPO_VEHICULO' AND p.clave=v.tipo_vehiculo WHERE v.tipo_vehiculo IS NOT NULL AND p.id IS NULL;"
  "SELECT COUNT(*) FROM compras WHERE costo_adquisicion <= 0;"
  "SELECT COUNT(*) FROM ventas WHERE precio_final <= 0 OR costo_compra_al_vender < 0 OR costo_refacciones_al_vender < 0 OR costo_total_al_vender < 0;"
  "SELECT COUNT(*) FROM refacciones WHERE costo_repuestos < 0 OR costo_mano_obra < 0 OR costo_servicios_externos < 0;"
  "SELECT COUNT(*) FROM (SELECT vehiculo_id FROM ventas WHERE activo=1 GROUP BY vehiculo_id HAVING COUNT(*) > 1) x;"
  "SELECT COUNT(*) FROM (SELECT vehiculo_id FROM compras WHERE activo=1 GROUP BY vehiculo_id HAVING COUNT(*) > 1) x;"
  "SELECT COUNT(*) FROM (SELECT id_operacion_offline FROM refacciones WHERE id_operacion_offline IS NOT NULL GROUP BY id_operacion_offline HAVING COUNT(*) > 1) x;"
)


flyway_v5="$(run_scalar "SELECT COUNT(*) FROM flyway_schema_history WHERE version = '5' AND success = 1;")"
if [[ "$flyway_v5" != "1" ]]; then
  echo "La restauración no contiene una migración Flyway V5 exitosa." >&2
  exit 32
fi

for sql in "${checks[@]}"; do
  violations="$(run_scalar "$sql")"
  if [[ "$violations" != "0" ]]; then
    echo "Falló una verificación de integridad. Violaciones: $violations" >&2
    echo "Consulta: $sql" >&2
    exit 31
  fi
done

printf 'Verificación de integridad satisfactoria para %s.\n' "$DB_NAME"
