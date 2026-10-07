-- Fixture exclusivo del perfil E2E para las auditorías CQ-04.
-- Mantiene un detalle público disponible aunque CQ-03 venda y despublique
-- el vehículo transaccional que crea durante su flujo extremo a extremo.

INSERT INTO vehiculos (
    activo,
    marca,
    modelo,
    tipo_vehiculo,
    anio,
    matricula,
    numero_chasis,
    color,
    kilometraje,
    estado,
    costo_inicial,
    precio_venta_estimado,
    publicado,
    descripcion_publica,
    observaciones_internas
)
VALUES (
    1,
    'Pamahe',
    'Accesibilidad E2E',
    'AUTO',
    2024,
    'A11Y001',
    'A11Y-E2E-000001',
    'Gris',
    15000,
    'DISPONIBLE',
    500000.00,
    650000.00,
    1,
    'Vehículo de prueba utilizado exclusivamente para las validaciones automatizadas de accesibilidad.',
    'Fixture exclusivo del perfil E2E.'
)
ON DUPLICATE KEY UPDATE
    activo = 1,
    estado = 'DISPONIBLE',
    precio_venta_estimado = 650000.00,
    publicado = 1,
    descripcion_publica = 'Vehículo de prueba utilizado exclusivamente para las validaciones automatizadas de accesibilidad.';
