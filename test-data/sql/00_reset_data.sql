-- PAMAHE - RESET DE DATOS DE PRUEBA
-- DESTRUCTIVO: borra datos funcionales de la base actual, conserva estructura y flyway_schema_history.
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE solicitudes_venta_imagenes;
TRUNCATE TABLE solicitudes_venta_vehiculo;
TRUNCATE TABLE notificaciones;
TRUNCATE TABLE refaccion_operaciones_offline;
TRUNCATE TABLE imagenes_vehiculo;
TRUNCATE TABLE ventas;
TRUNCATE TABLE refacciones;
TRUNCATE TABLE compras;
TRUNCATE TABLE auditoria;
TRUNCATE TABLE vehiculos;
TRUNCATE TABLE clientes;
TRUNCATE TABLE usuarios_roles;
TRUNCATE TABLE usuarios;
TRUNCATE TABLE roles;
TRUNCATE TABLE parametros;
SET FOREIGN_KEY_CHECKS = 1;
