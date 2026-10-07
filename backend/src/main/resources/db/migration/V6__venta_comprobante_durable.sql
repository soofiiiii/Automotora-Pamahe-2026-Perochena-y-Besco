-- los tipos desactivados dejan de ofrecerse en nuevas operaciones,
-- pero se conservan para que los vehículos históricos sigan siendo legibles.
DROP TRIGGER IF EXISTS trg_parametros_tipo_no_desactivar;
DROP TRIGGER IF EXISTS trg_vehiculos_tipo_activo_update;

DELIMITER $$
CREATE TRIGGER trg_vehiculos_tipo_activo_update
BEFORE UPDATE ON vehiculos
FOR EACH ROW
BEGIN
    IF NOT (NEW.tipo_vehiculo <=> OLD.tipo_vehiculo)
       AND NEW.tipo_vehiculo IS NOT NULL
       AND NOT EXISTS (
            SELECT 1
            FROM parametros p
            WHERE p.categoria = 'TIPO_VEHICULO'
              AND p.clave = NEW.tipo_vehiculo
              AND p.activo = 1
       ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El tipo de vehículo debe existir y estar activo.';
    END IF;
END$$
DELIMITER ;

-- estado durable y reintentos persistentes para comprobantes de venta.
ALTER TABLE ventas
    ADD COLUMN estado_comprobante VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' AFTER comprobante_path,
    ADD COLUMN intentos_comprobante INT NOT NULL DEFAULT 0 AFTER estado_comprobante,
    ADD COLUMN ultimo_intento_comprobante DATETIME(6) NULL AFTER intentos_comprobante,
    ADD COLUMN proximo_intento_comprobante DATETIME(6) NULL AFTER ultimo_intento_comprobante,
    ADD COLUMN error_comprobante VARCHAR(1000) NULL AFTER proximo_intento_comprobante;

UPDATE ventas
SET estado_comprobante = CASE
        WHEN comprobante_path IS NOT NULL AND TRIM(comprobante_path) <> '' THEN 'GENERADO'
        ELSE 'PENDIENTE'
    END,
    proximo_intento_comprobante = CASE
        WHEN comprobante_path IS NULL OR TRIM(comprobante_path) = '' THEN CURRENT_TIMESTAMP(6)
        ELSE NULL
    END;

ALTER TABLE ventas
    ADD CONSTRAINT ck_ventas_estado_comprobante
        CHECK (estado_comprobante IN ('PENDIENTE', 'GENERADO', 'ERROR')),
    ADD CONSTRAINT ck_ventas_intentos_comprobante
        CHECK (intentos_comprobante >= 0);

CREATE INDEX idx_ventas_comprobante_reintento
    ON ventas (activo, estado_comprobante, proximo_intento_comprobante, intentos_comprobante);
