CREATE TABLE roles (
    id BIGINT NOT NULL AUTO_INCREMENT,
    activo BIT NOT NULL DEFAULT 1,
    creado_en DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    actualizado_en DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(200),
    CONSTRAINT pk_roles PRIMARY KEY (id),
    CONSTRAINT uk_roles_nombre UNIQUE (nombre)
);

CREATE TABLE usuarios (
    id BIGINT NOT NULL AUTO_INCREMENT,
    activo BIT NOT NULL DEFAULT 1,
    creado_en DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    actualizado_en DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    username VARCHAR(60) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL,
    telefono VARCHAR(40),
    CONSTRAINT pk_usuarios PRIMARY KEY (id),
    CONSTRAINT uk_usuarios_username UNIQUE (username),
    CONSTRAINT uk_usuarios_email UNIQUE (email)
);

CREATE TABLE usuarios_roles (
    usuario_id BIGINT NOT NULL,
    rol_id BIGINT NOT NULL,
    CONSTRAINT pk_usuarios_roles PRIMARY KEY (usuario_id, rol_id),
    CONSTRAINT fk_usuarios_roles_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    CONSTRAINT fk_usuarios_roles_rol FOREIGN KEY (rol_id) REFERENCES roles(id)
);

CREATE TABLE clientes (
    id BIGINT NOT NULL AUTO_INCREMENT,
    activo BIT NOT NULL DEFAULT 1,
    creado_en DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    actualizado_en DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    nombre VARCHAR(120) NOT NULL,
    apellido VARCHAR(120),
    razon_social VARCHAR(160),
    documento VARCHAR(30) NOT NULL,
    telefono VARCHAR(40),
    email VARCHAR(120),
    direccion VARCHAR(200),
    tipo_cliente VARCHAR(20) NOT NULL,
    CONSTRAINT pk_clientes PRIMARY KEY (id),
    CONSTRAINT uk_clientes_documento UNIQUE (documento)
);

CREATE TABLE vehiculos (
    id BIGINT NOT NULL AUTO_INCREMENT,
    activo BIT NOT NULL DEFAULT 1,
    creado_en DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    actualizado_en DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    marca VARCHAR(80) NOT NULL,
    modelo VARCHAR(80) NOT NULL,
    anio INT NOT NULL,
    matricula VARCHAR(30),
    numero_chasis VARCHAR(80),
    color VARCHAR(60),
    kilometraje INT,
    estado VARCHAR(30) NOT NULL,
    costo_inicial DECIMAL(14,2) DEFAULT 0,
    precio_venta_estimado DECIMAL(14,2) DEFAULT 0,
    publicado BIT NOT NULL DEFAULT 0,
    observaciones VARCHAR(1000),
    CONSTRAINT pk_vehiculos PRIMARY KEY (id),
    CONSTRAINT uk_vehiculos_matricula UNIQUE (matricula),
    CONSTRAINT uk_vehiculos_chasis UNIQUE (numero_chasis)
);

CREATE TABLE compras (
    id BIGINT NOT NULL AUTO_INCREMENT,
    activo BIT NOT NULL DEFAULT 1,
    creado_en DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    actualizado_en DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    vehiculo_id BIGINT NOT NULL,
    cliente_vendedor_id BIGINT NOT NULL,
    usuario_responsable_id BIGINT,
    fecha_compra DATE NOT NULL,
    costo_adquisicion DECIMAL(14,2) NOT NULL,
    comprobante_path VARCHAR(500),
    observaciones VARCHAR(1000),
    CONSTRAINT pk_compras PRIMARY KEY (id),
    CONSTRAINT uk_compras_vehiculo UNIQUE (vehiculo_id),
    CONSTRAINT fk_compras_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id),
    CONSTRAINT fk_compras_cliente FOREIGN KEY (cliente_vendedor_id) REFERENCES clientes(id),
    CONSTRAINT fk_compras_usuario FOREIGN KEY (usuario_responsable_id) REFERENCES usuarios(id)
);

CREATE TABLE refacciones (
    id BIGINT NOT NULL AUTO_INCREMENT,
    activo BIT NOT NULL DEFAULT 1,
    creado_en DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    actualizado_en DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    vehiculo_id BIGINT NOT NULL,
    responsable_id BIGINT,
    fecha DATE NOT NULL,
    tipo_trabajo VARCHAR(40) NOT NULL,
    descripcion VARCHAR(1000) NOT NULL,
    costo_repuestos DECIMAL(14,2) NOT NULL DEFAULT 0,
    costo_mano_obra DECIMAL(14,2) NOT NULL DEFAULT 0,
    costo_servicios_externos DECIMAL(14,2) NOT NULL DEFAULT 0,
    estado_tarea VARCHAR(30) NOT NULL,
    observaciones VARCHAR(1000),
    registro_fotografico_url VARCHAR(500),
    sincronizado_desde_offline BIT NOT NULL DEFAULT 0,
    CONSTRAINT pk_refacciones PRIMARY KEY (id),
    CONSTRAINT fk_refacciones_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id),
    CONSTRAINT fk_refacciones_responsable FOREIGN KEY (responsable_id) REFERENCES usuarios(id)
);

CREATE TABLE ventas (
    id BIGINT NOT NULL AUTO_INCREMENT,
    activo BIT NOT NULL DEFAULT 1,
    creado_en DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    actualizado_en DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    vehiculo_id BIGINT NOT NULL,
    cliente_comprador_id BIGINT NOT NULL,
    vendedor_id BIGINT,
    fecha_venta DATE NOT NULL,
    precio_final DECIMAL(14,2) NOT NULL,
    rentabilidad_calculada DECIMAL(14,2) NOT NULL,
    comprobante_path VARCHAR(500),
    observaciones VARCHAR(1000),
    CONSTRAINT pk_ventas PRIMARY KEY (id),
    CONSTRAINT uk_ventas_vehiculo UNIQUE (vehiculo_id),
    CONSTRAINT fk_ventas_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id),
    CONSTRAINT fk_ventas_cliente FOREIGN KEY (cliente_comprador_id) REFERENCES clientes(id),
    CONSTRAINT fk_ventas_usuario FOREIGN KEY (vendedor_id) REFERENCES usuarios(id)
);

CREATE TABLE imagenes_vehiculo (
    id BIGINT NOT NULL AUTO_INCREMENT,
    activo BIT NOT NULL DEFAULT 1,
    creado_en DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    actualizado_en DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    vehiculo_id BIGINT NOT NULL,
    url VARCHAR(500) NOT NULL,
    descripcion VARCHAR(200),
    publica BIT NOT NULL DEFAULT 1,
    principal BIT NOT NULL DEFAULT 0,
    CONSTRAINT pk_imagenes_vehiculo PRIMARY KEY (id),
    CONSTRAINT fk_imagenes_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id)
);

CREATE TABLE auditoria (
    id BIGINT NOT NULL AUTO_INCREMENT,
    activo BIT NOT NULL DEFAULT 1,
    creado_en DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    actualizado_en DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    usuario VARCHAR(80) NOT NULL,
    accion VARCHAR(50) NOT NULL,
    entidad VARCHAR(80) NOT NULL,
    entidad_id BIGINT,
    detalle VARCHAR(1000),
    CONSTRAINT pk_auditoria PRIMARY KEY (id)
);

CREATE TABLE parametros (
    id BIGINT NOT NULL AUTO_INCREMENT,
    activo BIT NOT NULL DEFAULT 1,
    creado_en DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    actualizado_en DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    categoria VARCHAR(80) NOT NULL,
    clave VARCHAR(80) NOT NULL,
    valor VARCHAR(500) NOT NULL,
    descripcion VARCHAR(300),
    CONSTRAINT pk_parametros PRIMARY KEY (id),
    CONSTRAINT uk_parametros_categoria_clave UNIQUE (categoria, clave)
);

CREATE INDEX idx_vehiculos_estado_publicado ON vehiculos(estado, publicado);
CREATE INDEX idx_refacciones_vehiculo ON refacciones(vehiculo_id);
CREATE INDEX idx_refacciones_estado ON refacciones(estado_tarea);
CREATE INDEX idx_auditoria_entidad ON auditoria(entidad, entidad_id);
