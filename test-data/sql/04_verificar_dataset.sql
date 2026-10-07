-- PAMAHE - VERIFICACIÓN DEL DATASET PARA MANUAL DE USUARIO
SET NAMES utf8mb4;

SELECT 'roles' AS conjunto, COUNT(*) AS cantidad FROM roles
UNION ALL SELECT 'usuarios', COUNT(*) FROM usuarios
UNION ALL SELECT 'clientes', COUNT(*) FROM clientes
UNION ALL SELECT 'vehiculos', COUNT(*) FROM vehiculos
UNION ALL SELECT 'vehiculos_publicados', COUNT(*) FROM vehiculos WHERE activo=1 AND publicado=1
UNION ALL SELECT 'compras', COUNT(*) FROM compras
UNION ALL SELECT 'refacciones', COUNT(*) FROM refacciones
UNION ALL SELECT 'ventas', COUNT(*) FROM ventas
UNION ALL SELECT 'solicitudes', COUNT(*) FROM solicitudes_venta_vehiculo
UNION ALL SELECT 'notificaciones_no_leidas', COUNT(*) FROM notificaciones WHERE activo=1 AND leida=0
UNION ALL SELECT 'auditoria', COUNT(*) FROM auditoria;

-- Debe devolver 0: publicaciones incompatibles con estado/precio.
SELECT v.id, v.marca, v.modelo, v.estado, v.publicado, v.precio_venta_usd
FROM vehiculos v
WHERE v.publicado=1 AND (v.activo=0 OR v.estado NOT IN ('DISPONIBLE','RESERVADO') OR v.precio_venta_usd<=0);

-- Debe devolver 0: ventas que no están reflejadas como VENDIDO.
SELECT ve.id, ve.marca, ve.modelo, ve.estado, v.id AS venta_id
FROM ventas v JOIN vehiculos ve ON ve.id=v.vehiculo_id
WHERE v.activo=1 AND ve.estado <> 'VENDIDO';

-- Debe devolver 0: snapshots de venta no coinciden con compra + refacciones no canceladas.
SELECT v.id AS venta_id, v.vehiculo_id, v.costo_total_al_vender, calc.costo_calculado
FROM ventas v
JOIN (
  SELECT c.vehiculo_id,
         c.costo_adquisicion + COALESCE(SUM(CASE WHEN r.activo=1 AND r.estado_tarea <> 'CANCELADA'
                                                  THEN r.costo_repuestos+r.costo_mano_obra+r.costo_servicios_externos
                                                  ELSE 0 END),0) AS costo_calculado
  FROM compras c
  LEFT JOIN refacciones r ON r.vehiculo_id=c.vehiculo_id
  WHERE c.activo=1
  GROUP BY c.vehiculo_id, c.costo_adquisicion
) calc ON calc.vehiculo_id=v.vehiculo_id
WHERE v.costo_total_al_vender <> calc.costo_calculado;

-- Dataset útil para capturas: estados presentes.
SELECT estado, COUNT(*) cantidad FROM vehiculos GROUP BY estado ORDER BY estado;
SELECT estado_tarea, COUNT(*) cantidad FROM refacciones GROUP BY estado_tarea ORDER BY estado_tarea;
SELECT estado, COUNT(*) cantidad FROM solicitudes_venta_vehiculo GROUP BY estado ORDER BY estado;

-- Publicaciones suficientes para probar paginación del catálogo (12 por página).
SELECT COUNT(*) AS publicaciones_activas FROM vehiculos WHERE activo=1 AND publicado=1;

-- Usuarios recomendados para pruebas manuales (sin exponer hashes).
SELECT id, username, nombre, activo, debe_cambiar_password FROM usuarios ORDER BY id;
