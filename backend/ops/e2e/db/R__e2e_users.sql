-- Datos de autenticación exclusivos del perfil E2E.
-- La ubicación filesystem:ops/e2e/db impide que estas credenciales formen parte
-- de las migraciones de producción empaquetadas en src/main/resources.

INSERT INTO usuarios (username, password_hash, nombre, email, telefono, activo, debe_cambiar_password)
VALUES
('admin', '$2y$10$NjQg4kFhO4MaY0quMZZk.eF1BS/a13nHbY1rQ5PMyP/Am2QCh8NKK', 'Administrador E2E', 'admin.e2e@pamahe.local', '099000001', 1, 0),
('vendedor.e2e', '$2y$10$e9NK6Ur/KiIHMFKGj7bfFOX4d/d9BDrVqv7EGWuazItfoiJyaO7.O', 'Vendedor E2E', 'vendedor.e2e@pamahe.local', '099000002', 1, 0),
('taller.e2e', '$2y$10$gIXy7S47oC6Gn4nyuvnSy.mXM2xNqXmEwEDkzEYSBhGEDhR3V4l5O', 'Taller E2E', 'taller.e2e@pamahe.local', '099000003', 1, 0)
ON DUPLICATE KEY UPDATE
password_hash = VALUES(password_hash),
nombre = VALUES(nombre),
email = VALUES(email),
telefono = VALUES(telefono),
activo = 1,
debe_cambiar_password = 0;

DELETE ur
FROM usuarios_roles ur
JOIN usuarios u ON u.id = ur.usuario_id
WHERE u.username IN ('admin', 'vendedor.e2e', 'taller.e2e');

INSERT INTO usuarios_roles (usuario_id, rol_id)
SELECT u.id, r.id
FROM usuarios u
JOIN roles r ON r.nombre = 'ADMINISTRADOR'
WHERE u.username = 'admin';

INSERT INTO usuarios_roles (usuario_id, rol_id)
SELECT u.id, r.id
FROM usuarios u
JOIN roles r ON r.nombre = 'VENDEDOR'
WHERE u.username = 'vendedor.e2e';

INSERT INTO usuarios_roles (usuario_id, rol_id)
SELECT u.id, r.id
FROM usuarios u
JOIN roles r ON r.nombre = 'TALLER'
WHERE u.username = 'taller.e2e';
