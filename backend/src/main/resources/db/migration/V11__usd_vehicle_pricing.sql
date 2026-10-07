-- El precio comercial principal pasa a expresarse en USD.
-- La columna UYU existente se conserva para compatibilidad con integraciones y reportes previos.
ALTER TABLE vehiculos
    ADD COLUMN precio_venta_usd DECIMAL(16,6) NOT NULL DEFAULT 0.000000 AFTER precio_venta_estimado;

INSERT INTO parametros (categoria, clave, valor, descripcion)
VALUES (
    'MONEDA',
    'USD_UYU',
    '41.00',
    'Cotización comercial utilizada para convertir precios de vehículos desde USD a pesos uruguayos.'
)
ON DUPLICATE KEY UPDATE
    descripcion = VALUES(descripcion),
    activo = TRUE;

-- Los precios existentes estaban almacenados en UYU. Se deriva un valor USD inicial sin alterar el dato original.
UPDATE vehiculos
SET precio_venta_usd = ROUND(
    precio_venta_estimado / (
        SELECT CAST(valor AS DECIMAL(14,4))
        FROM parametros
        WHERE categoria = 'MONEDA'
          AND clave = 'USD_UYU'
        LIMIT 1
    ),
    6
)
WHERE precio_venta_estimado IS NOT NULL
  AND precio_venta_estimado > 0
  AND precio_venta_usd = 0;
