-- Ejecutar en la base de ensayo antes de cada corrida. Solo lectura; no incluye PII.
SELECT 'vehiculos' entidad, COUNT(*) cantidad FROM vehiculos WHERE activo=1
UNION ALL SELECT 'clientes', COUNT(*) FROM clientes WHERE activo=1
UNION ALL SELECT 'compras', COUNT(*) FROM compras WHERE activo=1
UNION ALL SELECT 'ventas', COUNT(*) FROM ventas WHERE activo=1
UNION ALL SELECT 'refacciones', COUNT(*) FROM refacciones WHERE activo=1
UNION ALL SELECT 'auditoria', COUNT(*) FROM auditoria
UNION ALL SELECT 'catalogo_publicado', COUNT(*) FROM vehiculos WHERE activo=1 AND publicado=1 AND estado='DISPONIBLE';
