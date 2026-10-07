-- La ubicación es independiente del estado operativo. Para unidades históricas se usa OTRO
-- como valor inicial, evitando asumir que físicamente se encuentran en el local.
-- Los datos de financiación
-- quedan asociados a la venta sin introducir un módulo de pagos.

ALTER TABLE vehiculos
    ADD COLUMN ubicacion_actual VARCHAR(30) NOT NULL DEFAULT 'OTRO' AFTER estado;

ALTER TABLE ventas
    ADD COLUMN medio_pago VARCHAR(40) NULL AFTER precio_final,
    ADD COLUMN entidad_financiera VARCHAR(120) NULL AFTER medio_pago,
    ADD COLUMN monto_financiado DECIMAL(14,2) NULL AFTER entidad_financiera,
    ADD COLUMN estado_financiacion VARCHAR(20) NULL AFTER monto_financiado,
    ADD COLUMN canal_origen VARCHAR(30) NULL AFTER estado_financiacion,
    ADD COLUMN seguimiento_postventa_realizado BOOLEAN NOT NULL DEFAULT FALSE AFTER canal_origen;


UPDATE ventas
SET seguimiento_postventa_realizado = TRUE;

ALTER TABLE notificaciones
    ADD COLUMN venta_id BIGINT NULL AFTER vehiculo_id,
    ADD CONSTRAINT fk_notificaciones_venta
        FOREIGN KEY (venta_id) REFERENCES ventas(id);

CREATE INDEX idx_notificaciones_venta_tipo_activo
    ON notificaciones (venta_id, tipo, activo);

CREATE INDEX idx_ventas_seguimiento_postventa
    ON ventas (activo, seguimiento_postventa_realizado, fecha_venta);
