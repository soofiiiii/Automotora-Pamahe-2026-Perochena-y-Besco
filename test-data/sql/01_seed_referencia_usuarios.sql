SET NAMES utf8mb4;
START TRANSACTION;

-- Roles de aplicación
INSERT INTO roles (id, activo, creado_en, actualizado_en, nombre, descripcion) VALUES
(1, 1, '2026-01-02 09:00:00', '2026-01-02 09:00:00', 'ADMINISTRADOR', 'Administrador del sistema'),
(2, 1, '2026-01-02 09:00:00', '2026-01-02 09:00:00', 'DUENO', 'Dueño o administrador general'),
(3, 1, '2026-01-02 09:00:00', '2026-01-02 09:00:00', 'VENDEDOR', 'Empleado o vendedor'),
(4, 1, '2026-01-02 09:00:00', '2026-01-02 09:00:00', 'TALLER', 'Encargado de taller');

-- Usuarios internos de demostración
INSERT INTO usuarios (id, activo, creado_en, actualizado_en, username, password_hash, debe_cambiar_password, nombre, email, telefono) VALUES
(1, 1, '2026-01-02 09:10:00', '2026-10-06 08:00:00', 'admin', '$2y$10$NjQg4kFhO4MaY0quMZZk.eF1BS/a13nHbY1rQ5PMyP/Am2QCh8NKK', 0, 'Administración Pamahe', 'admin.manual@pamahe.local', '099000101'),
(2, 1, '2026-01-02 09:15:00', '2026-10-06 08:00:00', 'dueno.manual', '$2y$10$NjQg4kFhO4MaY0quMZZk.eF1BS/a13nHbY1rQ5PMyP/Am2QCh8NKK', 0, 'Gabriel Suárez', 'dueno.manual@pamahe.local', '099000102'),
(3, 1, '2026-01-02 09:20:00', '2026-10-06 08:00:00', 'vendedor.manual', '$2y$10$e9NK6Ur/KiIHMFKGj7bfFOX4d/d9BDrVqv7EGWuazItfoiJyaO7.O', 0, 'Camila Rodríguez', 'vendedor.manual@pamahe.local', '099000103'),
(4, 1, '2026-01-02 09:25:00', '2026-10-06 08:00:00', 'taller.manual', '$2y$10$gIXy7S47oC6Gn4nyuvnSy.mXM2xNqXmEwEDkzEYSBhGEDhR3V4l5O', 0, 'Nicolás Méndez', 'taller.manual@pamahe.local', '099000104'),
(5, 1, '2026-02-10 10:00:00', '2026-10-05 17:20:00', 'operaciones.manual', '$2y$10$e9NK6Ur/KiIHMFKGj7bfFOX4d/d9BDrVqv7EGWuazItfoiJyaO7.O', 0, 'Valentina López', 'operaciones.manual@pamahe.local', '099000105'),
(6, 1, '2026-09-28 11:00:00', '2026-09-28 11:00:00', 'cambio.clave', '$2y$10$NjQg4kFhO4MaY0quMZZk.eF1BS/a13nHbY1rQ5PMyP/Am2QCh8NKK', 1, 'Usuario Cambio de Clave', 'cambio.clave@pamahe.local', '099000106'),
(7, 1, '2026-09-29 11:00:00', '2026-09-29 11:00:00', 'desactivar.demo', '$2y$10$e9NK6Ur/KiIHMFKGj7bfFOX4d/d9BDrVqv7EGWuazItfoiJyaO7.O', 0, 'Usuario para Desactivar', 'desactivar.demo@pamahe.local', '099000107'),
(8, 0, '2026-05-12 09:00:00', '2026-09-20 18:00:00', 'usuario.inactivo', '$2y$10$e9NK6Ur/KiIHMFKGj7bfFOX4d/d9BDrVqv7EGWuazItfoiJyaO7.O', 0, 'Cuenta Histórica Inactiva', 'usuario.inactivo@pamahe.local', '099000108');

-- Asignaciones RBAC
INSERT INTO usuarios_roles (usuario_id, rol_id) VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 4),
(5, 3),
(5, 4),
(6, 3),
(7, 3),
(8, 3);

-- Parámetros requeridos por catálogo, moneda, contacto y chatbot
INSERT INTO parametros (id, activo, creado_en, actualizado_en, categoria, clave, valor, descripcion) VALUES
(1, 1, '2026-01-02 09:30:00', '2026-01-02 09:30:00', 'CONTACTO', 'WHATSAPP', '+59899000111', 'WhatsApp comercial de demostración'),
(2, 1, '2026-01-02 09:30:00', '2026-01-02 09:30:00', 'CONTACTO', 'TELEFONO', '+59845860000', 'Teléfono comercial de demostración'),
(3, 1, '2026-01-02 09:30:00', '2026-01-02 09:30:00', 'CONTACTO', 'EMAIL', 'contacto@pamahe.local', 'Correo comercial de demostración'),
(4, 1, '2026-01-02 09:30:00', '2026-01-02 09:30:00', 'CONTACTO', 'HORARIO', 'Lunes a viernes de 9:00 a 12:00 y de 14:30 a 19:30. Sábados de 10:00 a 13:30.', 'Horario comercial utilizado por el chatbot y el sitio público'),
(5, 1, '2026-01-02 09:35:00', '2026-01-02 09:35:00', 'TIPO_VEHICULO', 'AUTO', 'Automóvil', 'Automóvil / hatchback / sedán'),
(6, 1, '2026-01-02 09:35:00', '2026-01-02 09:35:00', 'TIPO_VEHICULO', 'SUV', 'SUV', 'Vehículo utilitario deportivo'),
(7, 1, '2026-01-02 09:35:00', '2026-01-02 09:35:00', 'TIPO_VEHICULO', 'CAMIONETA', 'Camioneta', 'Pick-up y camionetas'),
(8, 1, '2026-01-02 09:35:00', '2026-01-02 09:35:00', 'TIPO_VEHICULO', 'UTILITARIO', 'Utilitario', 'Vehículo utilitario / furgón'),
(9, 1, '2026-10-01 10:00:00', '2026-10-01 10:00:00', 'TIPO_VEHICULO', 'MINIVAN', 'Minivan', 'Tipo sin uso, reservado para probar la desactivación de parámetros'),
(10, 1, '2026-10-06 08:00:00', '2026-10-06 08:00:00', 'MONEDA', 'USD_UYU', '41.00', 'Cotización comercial de prueba: pesos uruguayos por dólar');

COMMIT;
