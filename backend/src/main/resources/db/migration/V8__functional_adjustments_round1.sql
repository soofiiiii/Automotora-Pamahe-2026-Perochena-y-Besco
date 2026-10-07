-- Infraestructura de alertas internas para revisión de vehículos.

CREATE TABLE notificaciones (
    id BIGINT NOT NULL AUTO_INCREMENT,
    activo BIT NOT NULL DEFAULT 1,
    creado_en DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    actualizado_en DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    usuario_id BIGINT NOT NULL,
    vehiculo_id BIGINT NULL,
    tipo VARCHAR(60) NOT NULL,
    titulo VARCHAR(160) NOT NULL,
    mensaje VARCHAR(500) NOT NULL,
    leida BIT NOT NULL DEFAULT 0,
    url_destino VARCHAR(300) NULL,
    CONSTRAINT pk_notificaciones PRIMARY KEY (id),
    CONSTRAINT fk_notificaciones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    CONSTRAINT fk_notificaciones_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id)
);

CREATE INDEX idx_notificaciones_usuario_estado
    ON notificaciones(usuario_id, activo, leida, creado_en);

CREATE INDEX idx_notificaciones_vehiculo_tipo
    ON notificaciones(vehiculo_id, tipo, activo);
