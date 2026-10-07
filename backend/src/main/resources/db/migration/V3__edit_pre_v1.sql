-- 1. Separación de información pública e interna del vehículo.
ALTER TABLE vehiculos
    CHANGE COLUMN observaciones observaciones_internas VARCHAR(1000) NULL,
    ADD COLUMN descripcion_publica VARCHAR(1000) NULL AFTER precio_venta_estimado;

-- 2. Auditoría con valores previos y nuevos.
ALTER TABLE auditoria
    ADD COLUMN valores_anteriores TEXT NULL AFTER detalle,
    ADD COLUMN valores_nuevos TEXT NULL AFTER valores_anteriores;

-- El usuario que registra una compra también debe quedar fijado desde el contexto autenticado.
UPDATE compras c
SET c.usuario_responsable_id = (SELECT MIN(u.id) FROM usuarios u WHERE u.activo = 1)
WHERE c.usuario_responsable_id IS NULL;

ALTER TABLE compras
    MODIFY COLUMN usuario_responsable_id BIGINT NOT NULL;

-- 3. Usuario registrador confiable e idempotencia para sincronización offline.
ALTER TABLE refacciones
    ADD COLUMN usuario_registra_id BIGINT NULL AFTER responsable_id,
    ADD COLUMN id_operacion_offline VARCHAR(100) NULL AFTER sincronizado_desde_offline;

UPDATE refacciones r
SET r.usuario_registra_id = COALESCE(
    r.responsable_id,
    (SELECT MIN(u.id) FROM usuarios u WHERE u.activo = 1)
)
WHERE r.usuario_registra_id IS NULL;

ALTER TABLE refacciones
    MODIFY COLUMN usuario_registra_id BIGINT NOT NULL,
    ADD CONSTRAINT fk_refacciones_usuario_registra
        FOREIGN KEY (usuario_registra_id) REFERENCES usuarios(id),
    ADD CONSTRAINT uk_refacciones_operacion_offline UNIQUE (id_operacion_offline);

-- 4. Cierre económico histórico de la venta.
ALTER TABLE ventas
    ADD COLUMN costo_compra_al_vender DECIMAL(14,2) NULL AFTER fecha_venta,
    ADD COLUMN costo_refacciones_al_vender DECIMAL(14,2) NULL AFTER costo_compra_al_vender,
    ADD COLUMN costo_total_al_vender DECIMAL(14,2) NULL AFTER costo_refacciones_al_vender;

UPDATE ventas v
JOIN vehiculos ve ON ve.id = v.vehiculo_id
LEFT JOIN compras c ON c.vehiculo_id = v.vehiculo_id AND c.activo = 1
LEFT JOIN (
    SELECT r.vehiculo_id,
           COALESCE(SUM(r.costo_repuestos + r.costo_mano_obra + r.costo_servicios_externos), 0) AS total_refacciones
    FROM refacciones r
    WHERE r.activo = 1 AND r.estado_tarea <> 'CANCELADA'
    GROUP BY r.vehiculo_id
) cr ON cr.vehiculo_id = v.vehiculo_id
SET v.costo_compra_al_vender = COALESCE(c.costo_adquisicion, ve.costo_inicial, 0),
    v.costo_refacciones_al_vender = COALESCE(cr.total_refacciones, 0),
    v.costo_total_al_vender = COALESCE(c.costo_adquisicion, ve.costo_inicial, 0) + COALESCE(cr.total_refacciones, 0),
    v.rentabilidad_calculada = v.precio_final - (COALESCE(c.costo_adquisicion, ve.costo_inicial, 0) + COALESCE(cr.total_refacciones, 0));

UPDATE ventas v
SET v.vendedor_id = (SELECT MIN(u.id) FROM usuarios u WHERE u.activo = 1)
WHERE v.vendedor_id IS NULL;

ALTER TABLE ventas
    MODIFY COLUMN vendedor_id BIGINT NOT NULL,
    MODIFY COLUMN costo_compra_al_vender DECIMAL(14,2) NOT NULL,
    MODIFY COLUMN costo_refacciones_al_vender DECIMAL(14,2) NOT NULL,
    MODIFY COLUMN costo_total_al_vender DECIMAL(14,2) NOT NULL;

-- 5. Las rutas almacenadas dejan de ser URLs públicas y pasan a ser rutas relativas controladas.
ALTER TABLE imagenes_vehiculo
    CHANGE COLUMN url ruta_archivo VARCHAR(500) NOT NULL;

UPDATE imagenes_vehiculo
SET ruta_archivo = CASE
    WHEN publica = 1 THEN CONCAT('public/vehiculos/', SUBSTRING_INDEX(ruta_archivo, 'vehiculos/', -1))
    ELSE CONCAT('private/vehiculos/', SUBSTRING_INDEX(ruta_archivo, 'vehiculos/', -1))
END
WHERE ruta_archivo LIKE '%vehiculos/%'
  AND ruta_archivo NOT LIKE 'public/vehiculos/%'
  AND ruta_archivo NOT LIKE 'private/vehiculos/%';

-- Una imagen privada nunca puede quedar marcada como principal del catálogo.
UPDATE imagenes_vehiculo
SET principal = 0
WHERE publica = 0 AND principal = 1;

-- Conserva una sola principal por vehículo antes de crear la restricción.
UPDATE imagenes_vehiculo i
JOIN (
    SELECT vehiculo_id, MIN(id) AS id_principal
    FROM imagenes_vehiculo
    WHERE activo = 1 AND principal = 1
    GROUP BY vehiculo_id
) elegida ON elegida.vehiculo_id = i.vehiculo_id
SET i.principal = 0
WHERE i.activo = 1 AND i.principal = 1 AND i.id <> elegida.id_principal;

ALTER TABLE imagenes_vehiculo
    ADD COLUMN principal_vehiculo_activo BIGINT
        GENERATED ALWAYS AS (
            CASE WHEN activo = 1 AND principal = 1 THEN vehiculo_id ELSE NULL END
        ) STORED,
    ADD CONSTRAINT uk_imagen_principal_activa UNIQUE (principal_vehiculo_activo);

-- 6. Los comprobantes se referencian dentro del almacenamiento privado.
UPDATE compras
SET comprobante_path = CONCAT('compras/', SUBSTRING_INDEX(comprobante_path, '/', -1))
WHERE comprobante_path LIKE '%comprobantes/compra/%';

UPDATE ventas
SET comprobante_path = CONCAT('ventas/', SUBSTRING_INDEX(comprobante_path, '/', -1))
WHERE comprobante_path LIKE '%comprobantes/venta/%';

CREATE INDEX idx_refacciones_vehiculo_estado_activo
    ON refacciones(vehiculo_id, estado_tarea, activo);

CREATE INDEX idx_ventas_vehiculo_activo
    ON ventas(vehiculo_id, activo);

CREATE INDEX idx_compras_vehiculo_activo
    ON compras(vehiculo_id, activo);
