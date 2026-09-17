
-- -----------------------------------------------------------------------------
-- 1. Tipo de vehículo: el valor se agrega como clave de parámetros, pero
--    queda protegido por una FK compuesta que fija también la categoría.
-- -----------------------------------------------------------------------------
ALTER TABLE vehiculos
    ADD COLUMN tipo_vehiculo VARCHAR(50) NULL AFTER modelo,
    ADD COLUMN tipo_vehiculo_categoria VARCHAR(80) NOT NULL DEFAULT 'TIPO_VEHICULO' AFTER tipo_vehiculo;

INSERT INTO parametros (categoria, clave, valor, descripcion)
VALUES
('TIPO_VEHICULO', 'AUTO', 'Automóvil', 'Tipo de vehículo utilizable en stock y catálogo'),
('TIPO_VEHICULO', 'SUV', 'SUV', 'Tipo de vehículo utilizable en stock y catálogo'),
('TIPO_VEHICULO', 'CAMIONETA', 'Camioneta', 'Tipo de vehículo utilizable en stock y catálogo'),
('TIPO_VEHICULO', 'UTILITARIO', 'Utilitario', 'Tipo de vehículo utilizable en stock y catálogo')
ON DUPLICATE KEY UPDATE
    valor = VALUES(valor),
    descripcion = VALUES(descripcion);

ALTER TABLE vehiculos
    ADD CONSTRAINT ck_vehiculos_tipo_categoria
        CHECK (tipo_vehiculo_categoria = 'TIPO_VEHICULO'),
    ADD CONSTRAINT fk_vehiculos_tipo_parametro
        FOREIGN KEY (tipo_vehiculo_categoria, tipo_vehiculo)
        REFERENCES parametros(categoria, clave)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT;


-- -----------------------------------------------------------------------------
-- 2. Rotación obligatoria de la credencial administrativa semilla.
--    AdminBootstrapService sustituye el hash versionado por un secreto externo en prod.
-- -----------------------------------------------------------------------------
ALTER TABLE usuarios
    ADD COLUMN debe_cambiar_password BIT NOT NULL DEFAULT 0 AFTER password_hash;

UPDATE usuarios
SET debe_cambiar_password = 1
WHERE username = 'admin' AND activo = 1;


-- -----------------------------------------------------------------------------
-- 3. Reserva transaccional de idempotencia para refacciones offline.
--    La PK serializa dos requests concurrentes con el mismo id_operacion.
-- -----------------------------------------------------------------------------
CREATE TABLE refaccion_operaciones_offline (
    id_operacion VARCHAR(100) NOT NULL,
    request_hash VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    refaccion_id BIGINT NULL,
    creado_en DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    actualizado_en DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_refaccion_operaciones_offline PRIMARY KEY (id_operacion),
    CONSTRAINT uk_refaccion_operaciones_refaccion UNIQUE (refaccion_id),
    CONSTRAINT ck_refaccion_operaciones_hash CHECK (CHAR_LENGTH(request_hash) = 64),
    CONSTRAINT fk_refaccion_operaciones_refaccion
        FOREIGN KEY (refaccion_id) REFERENCES refacciones(id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT
);

-- -----------------------------------------------------------------------------
-- 4. Validaciones de integridad económica y de dominio en la base.
-- -----------------------------------------------------------------------------
ALTER TABLE vehiculos
    ADD CONSTRAINT ck_vehiculos_anio CHECK (anio BETWEEN 1900 AND 2100),
    ADD CONSTRAINT ck_vehiculos_kilometraje CHECK (kilometraje IS NULL OR kilometraje >= 0),
    ADD CONSTRAINT ck_vehiculos_costo_inicial CHECK (costo_inicial IS NULL OR costo_inicial >= 0),
    ADD CONSTRAINT ck_vehiculos_precio_estimado CHECK (precio_venta_estimado IS NULL OR precio_venta_estimado >= 0);

ALTER TABLE compras
    ADD CONSTRAINT ck_compras_costo_adquisicion CHECK (costo_adquisicion > 0);

ALTER TABLE refacciones
    ADD CONSTRAINT ck_refacciones_costo_repuestos CHECK (costo_repuestos >= 0),
    ADD CONSTRAINT ck_refacciones_costo_mano_obra CHECK (costo_mano_obra >= 0),
    ADD CONSTRAINT ck_refacciones_costo_externos CHECK (costo_servicios_externos >= 0);

ALTER TABLE ventas
    ADD CONSTRAINT ck_ventas_precio_final CHECK (precio_final > 0),
    ADD CONSTRAINT ck_ventas_costo_compra_snapshot CHECK (costo_compra_al_vender >= 0),
    ADD CONSTRAINT ck_ventas_costo_refacciones_snapshot CHECK (costo_refacciones_al_vender >= 0),
    ADD CONSTRAINT ck_ventas_costo_total_snapshot CHECK (costo_total_al_vender >= 0);


-- -----------------------------------------------------------------------------
-- 5. Índices para reportes por período, stock al cierre y auditoría.
-- -----------------------------------------------------------------------------
CREATE INDEX idx_vehiculos_stock_filtros
    ON vehiculos(activo, estado, publicado, tipo_vehiculo, anio, precio_venta_estimado);
CREATE INDEX idx_ventas_fecha_activo
    ON ventas(activo, fecha_venta);
CREATE INDEX idx_ventas_vehiculo_activo_fecha
    ON ventas(vehiculo_id, activo, fecha_venta);
CREATE INDEX idx_compras_fecha_activo
    ON compras(activo, fecha_compra);
CREATE INDEX idx_compras_activo_fecha_vehiculo
    ON compras(activo, fecha_compra, vehiculo_id);
CREATE INDEX idx_refacciones_fecha_activo
    ON refacciones(activo, fecha);
CREATE INDEX idx_auditoria_fecha
    ON auditoria(creado_en);


-- -----------------------------------------------------------------------------
-- 6. Integridad semántica de TIPO_VEHICULO.
--    La FK garantiza existencia; los triggers garantizan que el parámetro esté activo
--    y que no pueda desactivarse mientras sea utilizado por un vehículo.
-- -----------------------------------------------------------------------------
DELIMITER $$

CREATE TRIGGER trg_vehiculos_tipo_activo_insert
BEFORE INSERT ON vehiculos
FOR EACH ROW
BEGIN
    IF NEW.tipo_vehiculo IS NOT NULL
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

CREATE TRIGGER trg_vehiculos_tipo_activo_update
BEFORE UPDATE ON vehiculos
FOR EACH ROW
BEGIN
    IF NEW.tipo_vehiculo IS NOT NULL
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

CREATE TRIGGER trg_parametros_tipo_no_desactivar
BEFORE UPDATE ON parametros
FOR EACH ROW
BEGIN
    IF OLD.categoria = 'TIPO_VEHICULO'
       AND OLD.activo = 1
       AND NEW.activo = 0
       AND EXISTS (
            SELECT 1
            FROM vehiculos v
            WHERE v.tipo_vehiculo = OLD.clave
       ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'No se puede desactivar un tipo de vehículo que está en uso.';
    END IF;
END$$

DELIMITER ;