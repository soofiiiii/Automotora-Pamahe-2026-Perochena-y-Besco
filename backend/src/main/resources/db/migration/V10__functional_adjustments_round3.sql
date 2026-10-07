
ALTER TABLE ventas
    ADD COLUMN datos_comprador_verificados BIT NOT NULL DEFAULT 0 AFTER seguimiento_postventa_realizado,
    ADD COLUMN documentacion_revisada BIT NOT NULL DEFAULT 0 AFTER datos_comprador_verificados,
    ADD COLUMN cobro_confirmado BIT NOT NULL DEFAULT 0 AFTER documentacion_revisada,
    ADD COLUMN proximo_mantenimiento DATE NULL AFTER cobro_confirmado;

UPDATE ventas
SET datos_comprador_verificados = 1,
    documentacion_revisada = 1,
    cobro_confirmado = 1;

CREATE INDEX idx_ventas_proximo_mantenimiento
    ON ventas (activo, proximo_mantenimiento);

CREATE TABLE solicitudes_venta_vehiculo (
    id BIGINT NOT NULL AUTO_INCREMENT,
    activo BIT NOT NULL DEFAULT 1,
    creado_en DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    actualizado_en DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    nombre VARCHAR(120) NOT NULL,
    telefono VARCHAR(40) NOT NULL,
    marca VARCHAR(80) NOT NULL,
    modelo VARCHAR(80) NOT NULL,
    anio INT NOT NULL,
    kilometraje INT NOT NULL,
    observaciones VARCHAR(1000),
    estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
    revisada_por BIGINT NULL,
    revisada_en DATETIME(6) NULL,
    CONSTRAINT pk_solicitudes_venta_vehiculo PRIMARY KEY (id),
    CONSTRAINT fk_solicitudes_venta_revisada_por FOREIGN KEY (revisada_por) REFERENCES usuarios(id)
);

CREATE TABLE solicitudes_venta_imagenes (
    id BIGINT NOT NULL AUTO_INCREMENT,
    activo BIT NOT NULL DEFAULT 1,
    creado_en DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    actualizado_en DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    solicitud_id BIGINT NOT NULL,
    ruta_archivo VARCHAR(500) NOT NULL,
    CONSTRAINT pk_solicitudes_venta_imagenes PRIMARY KEY (id),
    CONSTRAINT fk_solicitudes_venta_imagenes_solicitud
        FOREIGN KEY (solicitud_id) REFERENCES solicitudes_venta_vehiculo(id)
);

CREATE INDEX idx_solicitudes_venta_estado_creado
    ON solicitudes_venta_vehiculo (activo, estado, creado_en);

CREATE INDEX idx_solicitudes_venta_imagenes_solicitud
    ON solicitudes_venta_imagenes (solicitud_id, activo);
