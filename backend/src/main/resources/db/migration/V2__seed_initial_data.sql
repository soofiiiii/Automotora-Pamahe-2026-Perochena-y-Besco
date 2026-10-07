INSERT INTO roles (nombre, descripcion)
VALUES
('ADMINISTRADOR', 'Administrador del sistema'),
('DUENO', 'Dueño o administrador general'),
('VENDEDOR', 'Empleado o vendedor'),
('TALLER', 'Encargado de taller')
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

INSERT INTO usuarios (
    username,
    password_hash,
    nombre,
    email,
    telefono,
    activo
)
VALUES (
    'admin',
    '$2y$10$2hIPAMc3RmYmBggQTFVRVO.EDOJr/YBqTK.7TQX8NerpiB.Xodqm2',
    'Administrador Pamahe',
    'admin@pamahe.local',
    NULL,
    1
)
ON DUPLICATE KEY UPDATE
    password_hash = VALUES(password_hash),
    nombre = VALUES(nombre),
    email = VALUES(email),
    telefono = VALUES(telefono),
    activo = 1;

INSERT IGNORE INTO usuarios_roles (usuario_id, rol_id)
SELECT u.id, r.id
FROM usuarios u
JOIN roles r ON r.nombre = 'ADMINISTRADOR'
WHERE u.username = 'admin';

INSERT INTO parametros (categoria, clave, valor, descripcion)
VALUES
('CONTACTO', 'WHATSAPP', '+59899111222', 'WhatsApp comercial de la automotora'),
('CONTACTO', 'TELEFONO', '+59845860000', 'Teléfono comercial de la automotora'),
('CONTACTO', 'EMAIL', 'contacto@pamahe.local', 'Correo comercial de la automotora')
ON DUPLICATE KEY UPDATE
    valor = VALUES(valor),
    descripcion = VALUES(descripcion);