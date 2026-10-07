-- El documento duplicado deja de ser un bloqueo técnico: la interfaz advierte y el usuario decide.
ALTER TABLE clientes
    DROP INDEX uk_clientes_documento;

CREATE INDEX idx_clientes_documento
    ON clientes(documento);

-- Toda imagen nueva queda privada por defecto también a nivel de base de datos.
ALTER TABLE imagenes_vehiculo
    MODIFY COLUMN publica BIT NOT NULL DEFAULT 0;
