-- DATASET COMPLETO PAMAHE - 2026-10-06
-- Ejecutar únicamente sobre una base de DESARROLLO/DEMO.

-- PAMAHE - RESET DE DATOS DE PRUEBA
-- DESTRUCTIVO: borra datos funcionales de la base actual, conserva estructura y flyway_schema_history.
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE solicitudes_venta_imagenes;
TRUNCATE TABLE solicitudes_venta_vehiculo;
TRUNCATE TABLE notificaciones;
TRUNCATE TABLE refaccion_operaciones_offline;
TRUNCATE TABLE imagenes_vehiculo;
TRUNCATE TABLE ventas;
TRUNCATE TABLE refacciones;
TRUNCATE TABLE compras;
TRUNCATE TABLE auditoria;
TRUNCATE TABLE vehiculos;
TRUNCATE TABLE clientes;
TRUNCATE TABLE usuarios_roles;
TRUNCATE TABLE usuarios;
TRUNCATE TABLE roles;
TRUNCATE TABLE parametros;
SET FOREIGN_KEY_CHECKS = 1;

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

SET NAMES utf8mb4;
START TRANSACTION;

-- Clientes sintéticos: vendedores, compradores, ambos e histórico inactivo
INSERT INTO clientes (id, activo, creado_en, actualizado_en, nombre, apellido, razon_social, documento, telefono, email, direccion, tipo_cliente) VALUES
(1001, 1, '2026-02-01 10:00:00', '2026-10-05 17:00:00', 'Martín', 'Álvarez', NULL, '47001231', '099120101', 'martin.alvarez@example.test', 'Av. Artigas 421, Juan Lacaze', 'VENDEDOR'),
(1002, 1, '2026-02-01 10:00:00', '2026-10-05 17:00:00', 'Lucía', 'Fernández', NULL, '47001249', '098230202', 'lucia.fernandez@example.test', 'Rivera 742, Juan Lacaze', 'VENDEDOR'),
(1003, 1, '2026-02-01 10:00:00', '2026-10-05 17:00:00', 'Andrés', 'Cabrera', NULL, '47001257', '099340303', 'andres.cabrera@example.test', 'José Salvo 315, Juan Lacaze', 'VENDEDOR'),
(1004, 1, '2026-02-01 10:00:00', '2026-10-05 17:00:00', 'Paula', 'Giménez', NULL, '47001265', '098450404', 'paula.gimenez@example.test', 'Roma 518, Colonia Valdense', 'VENDEDOR'),
(1005, 1, '2026-02-01 10:00:00', '2026-10-05 17:00:00', 'Sergio', 'Pintos', NULL, '47001273', '099560505', 'sergio.pintos@example.test', 'Ituzaingó 1092, Nueva Helvecia', 'VENDEDOR'),
(1006, 1, '2026-02-01 10:00:00', '2026-10-05 17:00:00', 'Natalia', 'Silva', NULL, '47001281', '098670606', 'natalia.silva@example.test', 'Colón 833, Juan Lacaze', 'VENDEDOR'),
(1007, 1, '2026-02-01 10:00:00', '2026-10-05 17:00:00', 'Jorge', 'Pereyra', NULL, '47001290', '099780707', 'jorge.pereyra@example.test', 'Lavalleja 214, Rosario', 'VENDEDOR'),
(1008, 1, '2026-02-01 10:00:00', '2026-10-05 17:00:00', 'Mariana', 'Techera', NULL, '47001303', '098890808', 'mariana.techera@example.test', '18 de Julio 601, Juan Lacaze', 'VENDEDOR'),
(1009, 1, '2026-02-01 10:00:00', '2026-10-05 17:00:00', 'Federico', 'Sosa', NULL, '47001311', '099901909', 'federico.sosa@example.test', 'Zorrilla 445, Tarariras', 'VENDEDOR'),
(1010, 1, '2026-02-01 10:00:00', '2026-10-05 17:00:00', 'Ana', 'Olivera', NULL, '47001320', '098012010', 'ana.olivera@example.test', 'Daniel Fernández Crespo 328, Juan Lacaze', 'VENDEDOR'),
(1011, 1, '2026-02-01 10:00:00', '2026-10-05 17:00:00', 'Diego', 'Pereira', NULL, '39876541', '099620111', 'diego.pereira@example.test', 'José Enrique Rodó 1185, Juan Lacaze', 'COMPRADOR'),
(1012, 1, '2026-02-01 10:00:00', '2026-10-05 17:00:00', 'Carolina', 'Bentancur', NULL, '39876550', '098520212', 'carolina.bentancur@example.test', 'Treinta y Tres 410, Rosario', 'COMPRADOR'),
(1013, 1, '2026-02-01 10:00:00', '2026-10-05 17:00:00', 'Rodrigo', 'Méndez', NULL, '39876568', '099430313', 'rodrigo.mendez@example.test', 'Artigas 822, Nueva Helvecia', 'COMPRADOR'),
(1014, 1, '2026-02-01 10:00:00', '2026-10-05 17:00:00', 'Verónica', 'Acosta', NULL, '39876576', '098340414', 'veronica.acosta@example.test', 'Varela 255, Juan Lacaze', 'COMPRADOR'),
(1015, 1, '2026-02-01 10:00:00', '2026-10-05 17:00:00', 'Gonzalo', 'Ríos', NULL, '39876584', '099250515', 'gonzalo.rios@example.test', 'Canelones 188, Colonia del Sacramento', 'COMPRADOR'),
(1016, 1, '2026-02-01 10:00:00', '2026-10-05 17:00:00', 'Florencia', 'Díaz', NULL, '39876592', '098160616', 'florencia.diaz@example.test', 'Italia 907, Juan Lacaze', 'COMPRADOR'),
(1017, 1, '2026-02-01 10:00:00', '2026-10-05 17:00:00', 'Sebastián', 'Viera', NULL, '39876606', '099070717', 'sebastian.viera@example.test', 'Sarandí 563, Rosario', 'COMPRADOR'),
(1018, 1, '2026-02-01 10:00:00', '2026-10-05 17:00:00', 'Valeria', 'Correa', NULL, '39876614', '098980818', 'valeria.correa@example.test', 'Rincón 311, Juan Lacaze', 'COMPRADOR'),
(1019, 1, '2026-02-01 10:00:00', '2026-10-05 17:00:00', 'Emiliano', 'Rodríguez', NULL, '39876622', '099890919', 'emiliano.rodriguez@example.test', 'General Flores 690, Nueva Helvecia', 'COMPRADOR'),
(1020, 1, '2026-02-01 10:00:00', '2026-10-05 17:00:00', 'Mónica', 'Suárez', NULL, '39876630', '098701020', 'monica.suarez@example.test', 'España 476, Juan Lacaze', 'COMPRADOR'),
(1021, 1, '2026-02-01 10:00:00', '2026-10-05 17:00:00', 'Sofía', 'Martínez', NULL, '45681231', '099611121', 'sofia.martinez@example.test', 'Rivera 188, Juan Lacaze', 'AMBOS'),
(1022, 1, '2026-02-01 10:00:00', '2026-10-05 17:00:00', 'Pablo', 'García', NULL, '45681240', '098522222', 'pablo.garcia@example.test', 'Dr. Vachelli 521, Rosario', 'AMBOS'),
(1023, 1, '2026-02-01 10:00:00', '2026-10-05 17:00:00', 'Camila', 'Lemos', NULL, '45681258', '099433323', 'camila.lemos@example.test', 'José Pedro Varela 732, Juan Lacaze', 'AMBOS'),
(1024, 1, '2026-02-01 10:00:00', '2026-10-05 17:00:00', 'Hernán', 'Curbelo', NULL, '45681266', '098344424', 'hernan.curbelo@example.test', 'Lavalleja 914, Tarariras', 'AMBOS'),
(1025, 1, '2026-02-01 10:00:00', '2026-10-05 17:00:00', 'Comercial', NULL, 'Río de la Plata SAS', '219876540019', '45860011', 'compras@riodelaplata.example.test', 'Ruta 1 km 127, Colonia', 'AMBOS'),
(1026, 0, '2026-02-01 10:00:00', '2026-10-05 17:00:00', 'Cliente', 'Histórico', NULL, '35000018', '099000199', 'historico@example.test', 'Dirección archivada', 'COMPRADOR');

-- Inventario realista con todos los estados operativos y más de 12 publicaciones
INSERT INTO vehiculos (id, activo, creado_en, actualizado_en, marca, modelo, tipo_vehiculo, tipo_vehiculo_categoria, anio, matricula, numero_chasis, color, kilometraje, estado, ubicacion_actual, costo_inicial, precio_venta_estimado, precio_venta_usd, publicado, descripcion_publica, observaciones_internas) VALUES
(2001, 1, '2026-08-03 10:30:00', '2026-10-06 08:00:00', 'Toyota', 'Corolla Cross XEI', 'SUV', 'TIPO_VEHICULO', 2023, 'PAM2001', 'VINPAMAHE00002001', 'Blanco perlado', 34200, 'DISPONIBLE', 'LOCAL', 985000, 1348900.00, 32900, 1, 'SUV automático, excelente estado general, cámara de reversa y completo equipamiento.', 'Datos sintéticos para demostración y pruebas del manual de usuario.'),
(2002, 1, '2026-08-08 10:30:00', '2026-10-06 08:00:00', 'Volkswagen', 'Polo Highline', 'AUTO', 'TIPO_VEHICULO', 2022, 'PAM2002', 'VINPAMAHE00002002', 'Gris oscuro', 41800, 'DISPONIBLE', 'LOCAL', 690000, 979900.00, 23900, 1, 'Hatchback compacto, caja automática, interior cuidado y mantenimiento al día.', 'Datos sintéticos para demostración y pruebas del manual de usuario.'),
(2003, 1, '2026-08-12 10:30:00', '2026-10-06 08:00:00', 'Chevrolet', 'Onix Premier', 'AUTO', 'TIPO_VEHICULO', 2023, 'PAM2003', 'VINPAMAHE00002003', 'Rojo', 29100, 'DISPONIBLE', 'LOCAL', 665000, 938900.00, 22900, 1, 'Versión Premier con buen nivel de equipamiento, bajo kilometraje y excelente presentación.', 'Datos sintéticos para demostración y pruebas del manual de usuario.'),
(2004, 1, '2026-08-18 10:30:00', '2026-10-06 08:00:00', 'Fiat', 'Strada Volcano', 'CAMIONETA', 'TIPO_VEHICULO', 2022, 'PAM2004', 'VINPAMAHE00002004', 'Plata', 55300, 'DISPONIBLE', 'LOCAL', 760000, 1061900.00, 25900, 1, 'Pick-up liviana doble cabina, ideal para uso mixto laboral y familiar.', 'Datos sintéticos para demostración y pruebas del manual de usuario.'),
(2005, 1, '2026-08-22 10:30:00', '2026-10-06 08:00:00', 'Renault', 'Duster Intens', 'SUV', 'TIPO_VEHICULO', 2021, 'PAM2005', 'VINPAMAHE00002005', 'Azul', 67200, 'DISPONIBLE', 'LOCAL', 710000, 1004500.00, 24500, 1, 'SUV espaciosa y cómoda, con buen despeje y amplio baúl.', 'Datos sintéticos para demostración y pruebas del manual de usuario.'),
(2006, 1, '2026-08-27 10:30:00', '2026-10-06 08:00:00', 'Hyundai', 'HB20 Premium', 'AUTO', 'TIPO_VEHICULO', 2022, 'PAM2006', 'VINPAMAHE00002006', 'Negro', 48100, 'DISPONIBLE', 'LOCAL', 625000, 897900.00, 21900, 1, 'Compacto moderno, eficiente y bien equipado para uso urbano.', 'Datos sintéticos para demostración y pruebas del manual de usuario.'),
(2007, 1, '2026-09-01 10:30:00', '2026-10-06 08:00:00', 'Nissan', 'Kicks Advance', 'SUV', 'TIPO_VEHICULO', 2021, 'PAM2007', 'VINPAMAHE00002007', 'Gris plata', 59800, 'DISPONIBLE', 'LOCAL', 805000, 1143900.00, 27900, 1, 'SUV automática con cámara, buena posición de manejo y excelente confort.', 'Datos sintéticos para demostración y pruebas del manual de usuario.'),
(2008, 1, '2026-09-03 10:30:00', '2026-10-06 08:00:00', 'Peugeot', '208 Allure', 'AUTO', 'TIPO_VEHICULO', 2023, 'PAM2008', 'VINPAMAHE00002008', 'Blanco', 26500, 'DISPONIBLE', 'LOCAL', 730000, 1020900.00, 24900, 1, 'Diseño moderno, buen equipamiento de confort y consumo contenido.', 'Datos sintéticos para demostración y pruebas del manual de usuario.'),
(2009, 1, '2026-07-28 10:30:00', '2026-10-06 08:00:00', 'Ford', 'Ranger XLS 4x2', 'CAMIONETA', 'TIPO_VEHICULO', 2020, 'PAM2009', 'VINPAMAHE00002009', 'Gris grafito', 88100, 'RESERVADO', 'LOCAL', 1110000, 1594900.00, 38900, 1, 'Pick-up robusta, cabina doble, preparada para trabajo y ruta.', 'Datos sintéticos para demostración y pruebas del manual de usuario.'),
(2010, 1, '2026-09-05 10:30:00', '2026-10-06 08:00:00', 'Volkswagen', 'Saveiro Cross', 'CAMIONETA', 'TIPO_VEHICULO', 2021, 'PAM2010', 'VINPAMAHE00002010', 'Blanco', 61500, 'DISPONIBLE', 'LOCAL', 810000, 1143900.00, 27900, 1, 'Pick-up compacta, versátil y cuidada, con buen historial de mantenimiento.', 'Datos sintéticos para demostración y pruebas del manual de usuario.'),
(2011, 1, '2026-07-20 10:30:00', '2026-10-06 08:00:00', 'Renault', 'Kangoo Express', 'UTILITARIO', 'TIPO_VEHICULO', 2020, 'PAM2011', 'VINPAMAHE00002011', 'Blanco', 93200, 'DISPONIBLE', 'LOCAL', 590000, 856900.00, 20900, 1, 'Utilitario práctico para reparto y trabajo, con espacio de carga bien conservado.', 'Datos sintéticos para demostración y pruebas del manual de usuario.'),
(2012, 1, '2026-09-06 10:30:00', '2026-10-06 08:00:00', 'Chevrolet', 'Tracker Premier', 'SUV', 'TIPO_VEHICULO', 2022, 'PAM2012', 'VINPAMAHE00002012', 'Azul oscuro', 46200, 'DISPONIBLE', 'LOCAL', 900000, 1266900.00, 30900, 1, 'SUV turbo, confortable y equipada, en muy buen estado general.', 'Datos sintéticos para demostración y pruebas del manual de usuario.'),
(2013, 1, '2026-08-25 10:30:00', '2026-10-06 08:00:00', 'Toyota', 'Yaris XLS', 'AUTO', 'TIPO_VEHICULO', 2021, 'PAM2013', 'VINPAMAHE00002013', 'Plata', 52700, 'DISPONIBLE', 'LOCAL', 745000, 1061900.00, 25900, 1, 'Automático, confiable y económico, ideal para ciudad y ruta.', 'Datos sintéticos para demostración y pruebas del manual de usuario.'),
(2014, 1, '2026-07-15 10:30:00', '2026-10-06 08:00:00', 'Fiat', 'Fiorino', 'UTILITARIO', 'TIPO_VEHICULO', 2019, 'PAM2014', 'VINPAMAHE00002014', 'Blanco', 107000, 'DISPONIBLE', 'LOCAL', 470000, 692900.00, 16900, 1, 'Furgón compacto con buena capacidad de carga y mantenimiento reciente.', 'Datos sintéticos para demostración y pruebas del manual de usuario.'),
(2015, 1, '2026-08-30 10:30:00', '2026-10-06 08:00:00', 'Jeep', 'Renegade Longitude', 'SUV', 'TIPO_VEHICULO', 2020, 'PAM2015', 'VINPAMAHE00002015', 'Verde oscuro', 74200, 'DISPONIBLE', 'LOCAL', 780000, 1102900.00, 26900, 1, 'SUV con buena posición de manejo, interior confortable y completo equipamiento.', 'Datos sintéticos para demostración y pruebas del manual de usuario.'),
(2016, 1, '2026-09-10 10:30:00', '2026-10-06 08:00:00', 'Toyota', 'Camry XLE', 'AUTO', 'TIPO_VEHICULO', 2020, 'PAM2016', 'VINPAMAHE00002016', 'Gris plata', 64500, 'DISPONIBLE', 'LOCAL', 870000, 1307900.00, 31900, 1, 'Sedán automático, interior cuidado, excelente nivel de confort y andar suave.', 'Datos sintéticos para demostración y pruebas del manual de usuario.'),
(2017, 1, '2026-09-18 10:30:00', '2026-10-06 08:00:00', 'Volkswagen', 'Golf Comfortline', 'AUTO', 'TIPO_VEHICULO', 2018, 'PAM2017', 'VINPAMAHE00002017', 'Azul', 98300, 'EN_TALLER', 'TALLER_INTERNO', 515000, 758500.00, 18500, 0, 'Hatchback en etapa final de preparación mecánica y estética.', 'Datos sintéticos para demostración y pruebas del manual de usuario.'),
(2018, 1, '2026-09-20 10:30:00', '2026-10-06 08:00:00', 'Toyota', 'Hilux SRV 4x4', 'CAMIONETA', 'TIPO_VEHICULO', 2019, 'PAM2018', 'VINPAMAHE00002018', 'Gris', 125400, 'EN_TALLER', 'TALLER_EXTERNO', 1020000, 1512900.00, 36900, 0, 'Pick-up 4x4 en proceso de reacondicionamiento de carrocería y pintura.', 'Datos sintéticos para demostración y pruebas del manual de usuario.'),
(2019, 1, '2026-10-04 10:30:00', '2026-10-06 08:00:00', 'Suzuki', 'Swift GLX', 'AUTO', 'TIPO_VEHICULO', 2020, 'PAM2019', 'VINPAMAHE00002019', 'Rojo', 71400, 'COMPRADO', 'LOCAL', 455000, 733900.00, 17900, 0, 'Unidad recién ingresada, pendiente de evaluación inicial.', 'Datos sintéticos para demostración y pruebas del manual de usuario.'),
(2020, 1, '2026-10-05 10:30:00', '2026-10-06 08:00:00', 'Honda', 'HR-V EX', 'SUV', 'TIPO_VEHICULO', 2021, 'PAM2020', 'VINPAMAHE00002020', 'Blanco', 60800, 'COMPRADO', 'LOCAL', 785000, 1184900.00, 28900, 0, 'SUV recién ingresada, pendiente de definición de destino post compra.', 'Datos sintéticos para demostración y pruebas del manual de usuario.'),
(2021, 1, '2026-08-02 10:30:00', '2026-10-06 08:00:00', 'Chevrolet', 'Celta LT', 'AUTO', 'TIPO_VEHICULO', 2015, 'PAM2021', 'VINPAMAHE00002021', 'Plata', 138000, 'DISPONIBLE', 'LOCAL', 275000, 446900.00, 10900, 0, 'Compacto económico, mecánica sencilla y buen funcionamiento general.', 'Datos sintéticos para demostración y pruebas del manual de usuario.'),
(2022, 1, '2026-08-16 10:30:00', '2026-10-06 08:00:00', 'Peugeot', 'Partner Furgón', 'UTILITARIO', 'TIPO_VEHICULO', 2019, 'PAM2022', 'VINPAMAHE00002022', 'Blanco', 112000, 'DISPONIBLE', 'LOCAL', 420000, 651900.00, 15900, 0, 'Utilitario de carga revisado, listo para uso comercial.', 'Datos sintéticos para demostración y pruebas del manual de usuario.'),
(2023, 1, '2026-09-22 10:30:00', '2026-10-06 08:00:00', 'Volkswagen', 'T-Cross Highline', 'SUV', 'TIPO_VEHICULO', 2024, 'PAM2023', 'VINPAMAHE00002023', 'Negro', 18200, 'RESERVADO', 'LOCAL', 995000, 1430900.00, 34900, 0, 'SUV reciente reservada para un cliente, aún no vendida.', 'Datos sintéticos para demostración y pruebas del manual de usuario.'),
(2024, 1, '2026-06-12 10:30:00', '2026-10-06 08:00:00', 'Toyota', 'Corolla XEI', 'AUTO', 'TIPO_VEHICULO', 2020, 'PAM2024', 'VINPAMAHE00002024', 'Blanco', 76000, 'VENDIDO', 'OTRO', 610000, 963500.00, 23500, 0, 'Unidad vendida; registro conservado para historial y reportes.', 'Datos sintéticos para demostración y pruebas del manual de usuario.'),
(2025, 1, '2026-06-20 10:30:00', '2026-10-06 08:00:00', 'Hyundai', 'Creta Premium', 'SUV', 'TIPO_VEHICULO', 2021, 'PAM2025', 'VINPAMAHE00002025', 'Gris', 69000, 'VENDIDO', 'OTRO', 690000, 1102900.00, 26900, 0, 'Unidad vendida; registro conservado para historial y reportes.', 'Datos sintéticos para demostración y pruebas del manual de usuario.'),
(2026, 1, '2026-05-14 10:30:00', '2026-10-06 08:00:00', 'Chevrolet', 'S10 LTZ 4x2', 'CAMIONETA', 'TIPO_VEHICULO', 2019, 'PAM2026', 'VINPAMAHE00002026', 'Negro', 118000, 'VENDIDO', 'OTRO', 830000, 1389900.00, 33900, 0, 'Unidad vendida; registro conservado para historial y reportes.', 'Datos sintéticos para demostración y pruebas del manual de usuario.'),
(2027, 1, '2026-06-03 10:30:00', '2026-10-06 08:00:00', 'Volkswagen', 'Virtus Highline', 'AUTO', 'TIPO_VEHICULO', 2022, 'PAM2027', 'VINPAMAHE00002027', 'Plata', 49000, 'VENDIDO', 'OTRO', 650000, 1061900.00, 25900, 0, 'Unidad vendida; registro conservado para historial y reportes.', 'Datos sintéticos para demostración y pruebas del manual de usuario.'),
(2028, 1, '2026-04-22 10:30:00', '2026-10-06 08:00:00', 'Renault', 'Oroch Outsider', 'CAMIONETA', 'TIPO_VEHICULO', 2020, 'PAM2028', 'VINPAMAHE00002028', 'Rojo', 85000, 'VENDIDO', 'OTRO', 590000, 1020900.00, 24900, 0, 'Unidad vendida; registro conservado para historial y reportes.', 'Datos sintéticos para demostración y pruebas del manual de usuario.'),
(2029, 1, '2026-07-01 10:30:00', '2026-10-06 08:00:00', 'Jeep', 'Compass Longitude', 'SUV', 'TIPO_VEHICULO', 2021, 'PAM2029', 'VINPAMAHE00002029', 'Blanco', 63000, 'VENDIDO', 'OTRO', 780000, 1307900.00, 31900, 0, 'Unidad vendida; registro conservado para historial y reportes.', 'Datos sintéticos para demostración y pruebas del manual de usuario.'),
(2030, 1, '2026-07-07 10:30:00', '2026-10-06 08:00:00', 'Nissan', 'Versa Advance', 'AUTO', 'TIPO_VEHICULO', 2017, 'PAM2030', 'VINPAMAHE00002030', 'Gris', 104000, 'DISPONIBLE', 'LOCAL', 350000, 610900.00, 14900, 0, 'Unidad de demostración destinada a probar el flujo de baja lógica.', 'Datos sintéticos para demostración y pruebas del manual de usuario.'),
(2031, 0, '2026-03-11 10:30:00', '2026-10-06 08:00:00', 'Fiat', 'Uno Way', 'AUTO', 'TIPO_VEHICULO', 2013, 'PAM2031', 'VINPAMAHE00002031', 'Rojo', 168000, 'DADO_DE_BAJA', 'OTRO', 210000, 389500.00, 9500, 0, 'Registro histórico de una unidad dada de baja.', 'Datos sintéticos para demostración y pruebas del manual de usuario.'),
(2032, 1, '2026-09-24 10:30:00', '2026-10-06 08:00:00', 'Mazda', '3 Touring', 'AUTO', 'TIPO_VEHICULO', 2019, 'PAM2032', 'VINPAMAHE00002032', 'Azul oscuro', 82000, 'EN_TALLER', 'TALLER_INTERNO', 520000, 856900.00, 20900, 0, 'Todas las tareas fueron finalizadas; la unidad espera revisión antes de pasar a Disponible.', 'Datos sintéticos para demostración y pruebas del manual de usuario.');

-- Una compra de origen por vehículo
INSERT INTO compras (id, activo, creado_en, actualizado_en, vehiculo_id, cliente_vendedor_id, usuario_responsable_id, fecha_compra, costo_adquisicion, comprobante_path, observaciones) VALUES
(3001, 1, '2026-08-03 10:30:00', '2026-08-03 10:30:00', 2001, 1001, 1, '2026-08-03', 985000, NULL, 'Compra de prueba con documentación revisada.'),
(3002, 1, '2026-08-08 10:30:00', '2026-08-08 10:30:00', 2002, 1002, 1, '2026-08-08', 690000, NULL, 'Compra de prueba con documentación revisada.'),
(3003, 1, '2026-08-12 10:30:00', '2026-08-12 10:30:00', 2003, 1003, 1, '2026-08-12', 665000, NULL, 'Compra de prueba con documentación revisada.'),
(3004, 1, '2026-08-18 10:30:00', '2026-08-18 10:30:00', 2004, 1004, 1, '2026-08-18', 760000, NULL, 'Compra de prueba con documentación revisada.'),
(3005, 1, '2026-08-22 10:30:00', '2026-08-22 10:30:00', 2005, 1005, 1, '2026-08-22', 710000, NULL, 'Compra de prueba con documentación revisada.'),
(3006, 1, '2026-08-27 10:30:00', '2026-08-27 10:30:00', 2006, 1006, 1, '2026-08-27', 625000, NULL, 'Compra de prueba con documentación revisada.'),
(3007, 1, '2026-09-01 10:30:00', '2026-09-01 10:30:00', 2007, 1007, 1, '2026-09-01', 805000, NULL, 'Compra de prueba con documentación revisada.'),
(3008, 1, '2026-09-03 10:30:00', '2026-09-03 10:30:00', 2008, 1008, 1, '2026-09-03', 730000, NULL, 'Compra de prueba con documentación revisada.'),
(3009, 1, '2026-07-28 10:30:00', '2026-07-28 10:30:00', 2009, 1009, 1, '2026-07-28', 1110000, NULL, 'Compra de prueba con documentación revisada.'),
(3010, 1, '2026-09-05 10:30:00', '2026-09-05 10:30:00', 2010, 1010, 1, '2026-09-05', 810000, NULL, 'Compra de prueba con documentación revisada.'),
(3011, 1, '2026-07-20 10:30:00', '2026-07-20 10:30:00', 2011, 1021, 1, '2026-07-20', 590000, NULL, 'Compra de prueba con documentación revisada.'),
(3012, 1, '2026-09-06 10:30:00', '2026-09-06 10:30:00', 2012, 1022, 1, '2026-09-06', 900000, NULL, 'Compra de prueba con documentación revisada.'),
(3013, 1, '2026-08-25 10:30:00', '2026-08-25 10:30:00', 2013, 1023, 1, '2026-08-25', 745000, NULL, 'Compra de prueba con documentación revisada.'),
(3014, 1, '2026-07-15 10:30:00', '2026-07-15 10:30:00', 2014, 1024, 1, '2026-07-15', 470000, NULL, 'Compra de prueba con documentación revisada.'),
(3015, 1, '2026-08-30 10:30:00', '2026-08-30 10:30:00', 2015, 1025, 1, '2026-08-30', 780000, NULL, 'Compra de prueba con documentación revisada.'),
(3016, 1, '2026-09-10 10:30:00', '2026-09-10 10:30:00', 2016, 1001, 1, '2026-09-10', 870000, NULL, 'Compra de prueba con documentación revisada.'),
(3017, 1, '2026-09-18 10:30:00', '2026-09-18 10:30:00', 2017, 1002, 1, '2026-09-18', 515000, NULL, 'Compra de prueba con documentación revisada.'),
(3018, 1, '2026-09-20 10:30:00', '2026-09-20 10:30:00', 2018, 1003, 1, '2026-09-20', 1020000, NULL, 'Compra de prueba con documentación revisada.'),
(3019, 1, '2026-10-04 10:30:00', '2026-10-04 10:30:00', 2019, 1004, 1, '2026-10-04', 455000, NULL, 'Compra de prueba con documentación revisada.'),
(3020, 1, '2026-10-05 10:30:00', '2026-10-05 10:30:00', 2020, 1005, 1, '2026-10-05', 785000, NULL, 'Compra de prueba con documentación revisada.'),
(3021, 1, '2026-08-02 10:30:00', '2026-08-02 10:30:00', 2021, 1006, 1, '2026-08-02', 275000, NULL, 'Compra de prueba con documentación revisada.'),
(3022, 1, '2026-08-16 10:30:00', '2026-08-16 10:30:00', 2022, 1007, 1, '2026-08-16', 420000, NULL, 'Compra de prueba con documentación revisada.'),
(3023, 1, '2026-09-22 10:30:00', '2026-09-22 10:30:00', 2023, 1008, 1, '2026-09-22', 995000, NULL, 'Compra de prueba con documentación revisada.'),
(3024, 1, '2026-06-12 10:30:00', '2026-06-12 10:30:00', 2024, 1009, 1, '2026-06-12', 610000, NULL, 'Compra de prueba con documentación revisada.'),
(3025, 1, '2026-06-20 10:30:00', '2026-06-20 10:30:00', 2025, 1010, 1, '2026-06-20', 690000, NULL, 'Compra de prueba con documentación revisada.'),
(3026, 1, '2026-05-14 10:30:00', '2026-05-14 10:30:00', 2026, 1021, 1, '2026-05-14', 830000, NULL, 'Compra de prueba con documentación revisada.'),
(3027, 1, '2026-06-03 10:30:00', '2026-06-03 10:30:00', 2027, 1022, 1, '2026-06-03', 650000, NULL, 'Compra de prueba con documentación revisada.'),
(3028, 1, '2026-04-22 10:30:00', '2026-04-22 10:30:00', 2028, 1023, 1, '2026-04-22', 590000, NULL, 'Compra de prueba con documentación revisada.'),
(3029, 1, '2026-07-01 10:30:00', '2026-07-01 10:30:00', 2029, 1024, 1, '2026-07-01', 780000, NULL, 'Compra de prueba con documentación revisada.'),
(3030, 1, '2026-07-07 10:30:00', '2026-07-07 10:30:00', 2030, 1025, 1, '2026-07-07', 350000, NULL, 'Compra de prueba con documentación revisada.'),
(3031, 1, '2026-03-11 10:30:00', '2026-03-11 10:30:00', 2031, 1001, 1, '2026-03-11', 210000, NULL, 'Compra de prueba con documentación revisada.'),
(3032, 1, '2026-09-24 10:30:00', '2026-09-24 10:30:00', 2032, 1002, 1, '2026-09-24', 520000, NULL, 'Compra de prueba con documentación revisada.');

-- Tareas finalizadas, pendientes, en curso, canceladas y una sincronizada offline
INSERT INTO refacciones (id, activo, creado_en, actualizado_en, vehiculo_id, responsable_id, usuario_registra_id, fecha, tipo_trabajo, descripcion, costo_repuestos, costo_mano_obra, costo_servicios_externos, estado_tarea, observaciones, registro_fotografico_url, sincronizado_desde_offline, id_operacion_offline) VALUES
(4001, 1, '2026-08-05 16:00:00', '2026-08-05 17:00:00', 2001, 4, 4, '2026-08-05', 'MECANICA', 'Service preventivo, cambio de aceite y filtros.', 12500, 6500, 0, 'FINALIZADA', 'Control general sin observaciones.', NULL, 0, NULL),
(4002, 1, '2026-08-10 16:00:00', '2026-08-10 17:00:00', 2002, 4, 4, '2026-08-10', 'DETAILING', 'Limpieza profunda y tratamiento de interiores.', 2500, 4500, 0, 'FINALIZADA', 'Preparación para publicación.', NULL, 0, NULL),
(4003, 1, '2026-09-12 16:00:00', '2026-09-12 17:00:00', 2016, 4, 4, '2026-09-12', 'MECANICA', 'Cambio de aceite, filtros y revisión de frenos.', 18500, 6500, 0, 'FINALIZADA', 'Frenos dentro de parámetros.', NULL, 0, NULL),
(4004, 1, '2026-09-13 16:00:00', '2026-09-13 17:00:00', 2016, 4, 4, '2026-09-13', 'DETAILING', 'Limpieza interior y acondicionamiento final.', 0, 3500, 0, 'FINALIZADA', 'Listo para fotografía comercial.', NULL, 1, 'manual-offline-2016-001'),
(4005, 1, '2026-09-19 16:00:00', '2026-09-19 17:00:00', 2017, 4, 4, '2026-09-19', 'MECANICA', 'Reemplazo de bieletas y revisión del tren delantero.', 21000, 9000, 0, 'FINALIZADA', 'Prueba de manejo satisfactoria.', NULL, 0, NULL),
(4006, 1, '2026-10-05 16:00:00', '2026-10-05 17:00:00', 2017, 4, 4, '2026-10-05', 'REPUESTO', 'Sustitución de batería y verificación del sistema de carga.', 12500, 2500, 0, 'PENDIENTE', 'Batería solicitada al proveedor.', NULL, 0, NULL),
(4007, 1, '2026-09-22 16:00:00', '2026-09-22 17:00:00', 2018, 4, 4, '2026-09-22', 'CARROCERIA', 'Corrección de pequeño golpe en lateral derecho.', 0, 12500, 28000, 'EN_CURSO', 'Trabajo en taller externo.', NULL, 0, NULL),
(4008, 1, '2026-10-02 16:00:00', '2026-10-02 17:00:00', 2018, 4, 4, '2026-10-02', 'PINTURA', 'Pintura localizada posterior a trabajo de carrocería.', 6000, 9000, 24000, 'PENDIENTE', 'Programada al finalizar carrocería.', NULL, 0, NULL),
(4009, 1, '2026-09-25 16:00:00', '2026-09-25 17:00:00', 2032, 4, 4, '2026-09-25', 'MECANICA', 'Service completo y revisión de suspensión.', 17500, 8000, 0, 'FINALIZADA', 'Sin pendientes mecánicos.', NULL, 0, NULL),
(4010, 1, '2026-09-27 16:00:00', '2026-09-27 17:00:00', 2032, 4, 4, '2026-09-27', 'DETAILING', 'Detailing exterior e interior completo.', 3500, 5500, 0, 'FINALIZADA', 'Unidad pronta para revisión comercial.', NULL, 0, NULL),
(4011, 1, '2026-06-15 16:00:00', '2026-06-15 17:00:00', 2024, 4, 4, '2026-06-15', 'MECANICA', 'Service y frenos antes de publicación.', 24000, 8500, 0, 'FINALIZADA', NULL, NULL, 0, NULL),
(4012, 1, '2026-06-16 16:00:00', '2026-06-16 17:00:00', 2024, 4, 4, '2026-06-16', 'LIMPIEZA', 'Limpieza y preparación comercial.', 0, 3500, 0, 'FINALIZADA', NULL, NULL, 0, NULL),
(4013, 1, '2026-06-24 16:00:00', '2026-06-24 17:00:00', 2025, 4, 4, '2026-06-24', 'MECANICA', 'Mantenimiento preventivo completo.', 19000, 7000, 0, 'FINALIZADA', NULL, NULL, 0, NULL),
(4014, 1, '2026-05-20 16:00:00', '2026-05-20 17:00:00', 2026, 4, 4, '2026-05-20', 'SERVICIO_EXTERNO', 'Alineación, balanceo y revisión de neumáticos.', 0, 0, 8500, 'FINALIZADA', NULL, NULL, 0, NULL),
(4015, 1, '2026-05-22 16:00:00', '2026-05-22 17:00:00', 2026, 4, 4, '2026-05-22', 'REPUESTO', 'Cambio de dos neumáticos delanteros.', 32000, 2500, 0, 'FINALIZADA', NULL, NULL, 0, NULL),
(4016, 1, '2026-06-05 16:00:00', '2026-06-05 17:00:00', 2027, 4, 4, '2026-06-05', 'MECANICA', 'Service preventivo y scanner.', 15500, 6500, 0, 'FINALIZADA', NULL, NULL, 0, NULL),
(4017, 1, '2026-04-25 16:00:00', '2026-04-25 17:00:00', 2028, 4, 4, '2026-04-25', 'CARROCERIA', 'Reparación menor de paragolpes.', 4500, 6000, 12000, 'FINALIZADA', NULL, NULL, 0, NULL),
(4018, 1, '2026-07-04 16:00:00', '2026-07-04 17:00:00', 2029, 4, 4, '2026-07-04', 'MECANICA', 'Cambio de aceite, filtros y pastillas delanteras.', 22500, 8000, 0, 'FINALIZADA', NULL, NULL, 0, NULL),
(4019, 1, '2026-07-06 16:00:00', '2026-07-06 17:00:00', 2029, 4, 4, '2026-07-06', 'SERVICIO_EXTERNO', 'Trabajo cotizado pero finalmente no realizado.', 0, 0, 18000, 'CANCELADA', 'Cancelada: no debe integrar el costo histórico.', NULL, 0, NULL),
(4020, 1, '2026-07-09 16:00:00', '2026-07-09 17:00:00', 2030, 4, 4, '2026-07-09', 'LIMPIEZA', 'Limpieza inicial y aspirado.', 0, 2500, 0, 'FINALIZADA', NULL, NULL, 0, NULL);

-- Ventas históricas consistentes con snapshots económicos
INSERT INTO ventas (id, activo, creado_en, actualizado_en, vehiculo_id, cliente_comprador_id, vendedor_id, fecha_venta, costo_compra_al_vender, costo_refacciones_al_vender, costo_total_al_vender, precio_final, medio_pago, entidad_financiera, monto_financiado, estado_financiacion, canal_origen, seguimiento_postventa_realizado, datos_comprador_verificados, documentacion_revisada, cobro_confirmado, proximo_mantenimiento, rentabilidad_calculada, comprobante_path, estado_comprobante, intentos_comprobante, ultimo_intento_comprobante, proximo_intento_comprobante, error_comprobante, observaciones) VALUES
(5001, 1, '2026-10-01 15:00:00', '2026-10-01 15:30:00', 2024, 1011, 3, '2026-10-01', 610000, 36000, 646000, 1035000, 'FINANCIACION_BANCARIA', 'BROU', 620000, 'APROBADA', 'WHATSAPP', 0, 1, 1, 1, '2026-10-10', 389000, NULL, 'PENDIENTE', 0, NULL, '2026-10-06 08:05:00', NULL, 'Venta con financiación bancaria aprobada; seguimiento postventa pendiente.'),
(5002, 1, '2026-10-03 15:00:00', '2026-10-03 15:30:00', 2025, 1012, 2, '2026-10-03', 690000, 26000, 716000, 1110000, 'TRANSFERENCIA', NULL, NULL, NULL, 'REFERIDO', 1, 1, 1, 1, '2027-04-03', 394000, NULL, 'PENDIENTE', 0, NULL, '2026-10-06 08:05:00', NULL, 'Venta por transferencia, cliente referido.'),
(5003, 1, '2026-09-24 15:00:00', '2026-09-24 15:30:00', 2026, 1013, 3, '2026-09-24', 830000, 43000, 873000, 1395000, 'FINANCIACION_PROPIA', 'Automotora Pamahe', 450000, 'PENDIENTE', 'INSTAGRAM', 0, 1, 1, 1, '2026-12-20', 522000, NULL, 'PENDIENTE', 0, NULL, '2026-10-06 08:05:00', NULL, 'Financiación propia parcial; seguimiento pendiente.'),
(5004, 1, '2026-09-11 15:00:00', '2026-09-11 15:30:00', 2027, 1014, 3, '2026-09-11', 650000, 22000, 672000, 1060000, 'EFECTIVO', NULL, NULL, NULL, 'PRESENCIAL', 1, 1, 1, 1, NULL, 388000, NULL, 'PENDIENTE', 0, NULL, '2026-10-06 08:05:00', NULL, 'Venta presencial con documentación completa.'),
(5005, 1, '2026-08-20 15:00:00', '2026-08-20 15:30:00', 2028, 1015, 2, '2026-08-20', 590000, 22500, 612500, 1020000, 'VEHICULO_PARTE_PAGO', NULL, NULL, NULL, 'FACEBOOK', 1, 1, 1, 1, '2027-02-20', 407500, NULL, 'PENDIENTE', 0, NULL, '2026-10-06 08:05:00', NULL, 'Operación con vehículo usado como parte de pago.'),
(5006, 1, '2026-10-05 15:00:00', '2026-10-05 15:30:00', 2029, 1016, 3, '2026-10-05', 780000, 30500, 810500, 1315000, 'TRANSFERENCIA', NULL, NULL, NULL, 'SITIO_WEB', 0, 1, 1, 1, '2027-01-05', 504500, NULL, 'PENDIENTE', 0, NULL, '2026-10-06 08:05:00', NULL, 'Consulta originada en catálogo público; seguimiento pendiente.');

-- Historial servidor de una sincronización offline idempotente
INSERT INTO refaccion_operaciones_offline (id_operacion, request_hash, refaccion_id, creado_en, actualizado_en) VALUES
('manual-offline-2016-001', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 4004, '2026-09-13 18:00:00', '2026-09-13 18:00:00');

COMMIT;

SET NAMES utf8mb4;
START TRANSACTION;

-- Metadatos de imágenes públicas y privadas
INSERT INTO imagenes_vehiculo (id, activo, creado_en, actualizado_en, vehiculo_id, ruta_archivo, descripcion, publica, principal) VALUES
(6001, 1, '2026-09-10 12:00:00', '2026-09-10 12:00:00', 2016, 'public/vehiculos/2016/camry-principal.png', 'Vista exterior Toyota Camry XLE', 1, 1),
(6002, 1, '2026-09-10 12:02:00', '2026-09-10 12:02:00', 2016, 'private/vehiculos/2016/camry-interna.png', 'Fotografía interna privada para demostración', 0, 0),
(6003, 1, '2026-08-08 12:00:00', '2026-08-08 12:00:00', 2002, 'public/vehiculos/2002/polo-exterior.jpg', 'Vista exterior Volkswagen Polo', 1, 1),
(6004, 1, '2026-08-08 12:01:00', '2026-08-08 12:01:00', 2002, 'public/vehiculos/2002/polo-interior.jpg', 'Interior Volkswagen Polo', 1, 0),
(6005, 1, '2026-08-08 12:02:00', '2026-08-08 12:02:00', 2002, 'private/vehiculos/2002/polo-tablero.jpg', 'Fotografía interna del tablero', 0, 0);

-- Solicitudes públicas en los cuatro estados posibles
INSERT INTO solicitudes_venta_vehiculo (id, activo, creado_en, actualizado_en, nombre, telefono, marca, modelo, anio, kilometraje, observaciones, estado, revisada_por, revisada_en) VALUES
(8001, 1, '2026-10-06 09:15:00', '2026-10-06 09:15:00', 'María Laura Torres', '099310221', 'Toyota', 'Corolla', 2018, 88500, 'Vehículo de único dueño, service reciente y documentación al día.', 'PENDIENTE', NULL, NULL),
(8002, 1, '2026-10-05 16:40:00', '2026-10-06 10:00:00', 'Bruno Machado', '098441332', 'Chevrolet', 'Cruze', 2019, 72400, 'Interesa vender o entregar como parte de pago.', 'EN_REVISION', 3, '2026-10-06 10:00:00'),
(8003, 1, '2026-10-04 11:20:00', '2026-10-05 12:30:00', 'Laura Núñez', '099552443', 'Renault', 'Sandero', 2020, 64100, 'Disponible para coordinar inspección en Juan Lacaze.', 'CONTACTADA', 3, '2026-10-05 12:30:00'),
(8004, 1, '2026-10-02 18:10:00', '2026-10-03 09:20:00', 'Esteban Ramos', '098663554', 'Fiat', 'Palio', 2011, 176000, 'Unidad con detalles de carrocería; se adjuntan fotos.', 'DESCARTADA', 2, '2026-10-03 09:20:00');

-- Fotografías privadas de solicitudes
INSERT INTO solicitudes_venta_imagenes (id, activo, creado_en, actualizado_en, solicitud_id, ruta_archivo) VALUES
(9001, 1, '2026-10-06 09:15:00', '2026-10-06 09:15:00', 8001, 'private/solicitudes-venta/8001/foto-1.png'),
(9002, 1, '2026-10-06 09:15:00', '2026-10-06 09:15:00', 8001, 'private/solicitudes-venta/8001/foto-2.png'),
(9003, 1, '2026-10-06 09:15:00', '2026-10-06 09:15:00', 8001, 'private/solicitudes-venta/8001/foto-3.jpg'),
(9004, 1, '2026-10-06 09:15:00', '2026-10-06 09:15:00', 8001, 'private/solicitudes-venta/8001/foto-4.jpg'),
(9005, 1, '2026-10-06 09:15:00', '2026-10-06 09:15:00', 8001, 'private/solicitudes-venta/8001/foto-5.png'),
(9006, 1, '2026-10-05 16:40:00', '2026-10-05 16:40:00', 8002, 'private/solicitudes-venta/8002/foto-1.jpg'),
(9007, 1, '2026-10-04 11:20:00', '2026-10-04 11:20:00', 8003, 'private/solicitudes-venta/8003/foto-1.jpg');

-- Notificaciones para campana: taller listo, postventa y mantenimiento
INSERT INTO notificaciones (id, activo, creado_en, actualizado_en, usuario_id, vehiculo_id, venta_id, tipo, titulo, mensaje, leida, url_destino) VALUES
(7001, 1, '2026-10-06 09:00:00', '2026-10-06 09:00:00', 1, 2032, NULL, 'VEHICULO_LISTO_REVISION', 'Vehículo listo para revisión', 'Mazda 3 Touring 2019 completó todas las tareas de taller. Revisá la unidad antes de marcarla como Disponible.', 0, '/app/vehiculos/2032'),
(7002, 1, '2026-10-06 09:01:00', '2026-10-06 09:01:00', 2, 2032, NULL, 'VEHICULO_LISTO_REVISION', 'Vehículo listo para revisión', 'Mazda 3 Touring 2019 completó todas las tareas de taller. Revisá la unidad antes de marcarla como Disponible.', 0, '/app/vehiculos/2032'),
(7003, 1, '2026-10-06 09:02:00', '2026-10-06 09:02:00', 3, 2032, NULL, 'VEHICULO_LISTO_REVISION', 'Vehículo listo para revisión', 'Mazda 3 Touring 2019 completó todas las tareas de taller. Revisá la unidad antes de marcarla como Disponible.', 0, '/app/vehiculos/2032'),
(7004, 1, '2026-10-06 09:05:00', '2026-10-06 09:05:00', 3, 2024, 5001, 'SEGUIMIENTO_POSTVENTA', 'Seguimiento postventa pendiente', 'Contactá a Diego Pereira por la venta de Toyota Corolla XEI 2020.', 0, '/app/ventas/5001'),
(7005, 1, '2026-10-06 09:10:00', '2026-10-06 09:10:00', 1, 2024, 5001, 'PROXIMO_MANTENIMIENTO', 'Próximo mantenimiento', 'Toyota Corolla XEI 2020 tiene mantenimiento previsto para 2026-10-10.', 0, '/app/ventas/5001'),
(7006, 1, '2026-10-06 09:10:30', '2026-10-06 09:10:30', 2, 2024, 5001, 'PROXIMO_MANTENIMIENTO', 'Próximo mantenimiento', 'Toyota Corolla XEI 2020 tiene mantenimiento previsto para 2026-10-10.', 0, '/app/ventas/5001'),
(7007, 1, '2026-10-06 09:11:00', '2026-10-06 09:11:00', 3, 2024, 5001, 'PROXIMO_MANTENIMIENTO', 'Próximo mantenimiento', 'Toyota Corolla XEI 2020 tiene mantenimiento previsto para 2026-10-10.', 0, '/app/ventas/5001');

-- Eventos representativos para filtros de auditoría
INSERT INTO auditoria (id, activo, creado_en, actualizado_en, usuario, accion, entidad, entidad_id, detalle, valores_anteriores, valores_nuevos) VALUES
(10001, 1, '2026-09-24 10:31:00', '2026-09-24 10:31:00', 'admin', 'ALTA', 'Compra', 3031, 'Registro de compra del vehículo 2032', NULL, 'vehiculoId=2032, costoAdquisicion=520000, fechaCompra=2026-09-24'),
(10002, 1, '2026-09-25 16:02:00', '2026-09-25 16:02:00', 'taller.manual', 'ALTA', 'Refaccion', 4009, 'Registro de refacción del vehículo 2032', NULL, 'estado=FINALIZADA, costoTotal=25500'),
(10003, 1, '2026-09-27 16:05:00', '2026-09-27 16:05:00', 'taller.manual', 'ALTA', 'Refaccion', 4010, 'Registro de refacción del vehículo 2032', NULL, 'estado=FINALIZADA, costoTotal=9000'),
(10004, 1, '2026-09-27 16:06:00', '2026-09-27 16:06:00', 'taller.manual', 'MODIFICACION', 'Refaccion', 4010, 'Finalización de la tarea de detailing', 'estado=EN_CURSO', 'estado=FINALIZADA'),
(10005, 1, '2026-10-01 15:30:00', '2026-10-01 15:30:00', 'vendedor.manual', 'ALTA', 'Venta', 5001, 'Registro de venta del vehículo 2024', NULL, 'precioFinal=1035000, medioPago=FINANCIACION_BANCARIA'),
(10006, 1, '2026-10-03 15:30:00', '2026-10-03 15:30:00', 'dueno.manual', 'ALTA', 'Venta', 5002, 'Registro de venta del vehículo 2025', NULL, 'precioFinal=1110000, medioPago=TRANSFERENCIA'),
(10007, 1, '2026-10-04 09:00:00', '2026-10-04 09:00:00', 'admin', 'CAMBIO_PUBLICACION', 'Vehiculo', 2016, 'Vehículo habilitado para el catálogo', 'publicado=false', 'publicado=true'),
(10008, 1, '2026-10-04 09:05:00', '2026-10-04 09:05:00', 'admin', 'MODIFICACION', 'Vehiculo', 2016, 'Actualización de datos técnicos y comerciales del vehículo', 'precioVentaUsd=31500', 'precioVentaUsd=31900'),
(10009, 1, '2026-10-05 12:30:00', '2026-10-05 12:30:00', 'vendedor.manual', 'CAMBIO_ESTADO', 'SolicitudVentaVehiculo', 8003, 'Actualización del estado de revisión de solicitud pública.', 'estado=EN_REVISION', 'estado=CONTACTADA'),
(10010, 1, '2026-10-05 15:30:00', '2026-10-05 15:30:00', 'vendedor.manual', 'ALTA', 'Venta', 5006, 'Registro de venta del vehículo 2029', NULL, 'precioFinal=1315000, canalOrigen=SITIO_WEB'),
(10011, 1, '2026-10-05 17:00:00', '2026-10-05 17:00:00', 'admin', 'ALTA', 'Usuario', 7, 'Creación de usuario interno', NULL, 'username=desactivar.demo, roles=[VENDEDOR]'),
(10012, 1, '2026-10-06 08:15:00', '2026-10-06 08:15:00', 'admin', 'MODIFICACION', 'Parametro', 10, 'Actualización de parámetro MONEDA/USD_UYU', 'valor=40.80', 'valor=41.00'),
(10013, 1, '2026-10-06 08:30:00', '2026-10-06 08:30:00', 'vendedor.manual', 'CAMBIO_PUBLICACION', 'Vehiculo', 2001, 'Vehículo habilitado para el catálogo', 'publicado=false', 'publicado=true'),
(10014, 1, '2026-10-06 08:35:00', '2026-10-06 08:35:00', 'vendedor.manual', 'CAMBIO_ESTADO', 'Vehiculo', 2009, 'Reserva comercial de la unidad', 'estado=DISPONIBLE', 'estado=RESERVADO, publicado=true'),
(10015, 1, '2026-10-06 08:40:00', '2026-10-06 08:40:00', 'admin', 'MODIFICACION', 'Cliente', 1021, 'Actualización de cliente', 'telefono=099000000', 'telefono=099611121');

COMMIT;

-- PAMAHE - VERIFICACIÓN DEL DATASET PARA MANUAL DE USUARIO
SET NAMES utf8mb4;

SELECT 'roles' AS conjunto, COUNT(*) AS cantidad FROM roles
UNION ALL SELECT 'usuarios', COUNT(*) FROM usuarios
UNION ALL SELECT 'clientes', COUNT(*) FROM clientes
UNION ALL SELECT 'vehiculos', COUNT(*) FROM vehiculos
UNION ALL SELECT 'vehiculos_publicados', COUNT(*) FROM vehiculos WHERE activo=1 AND publicado=1
UNION ALL SELECT 'compras', COUNT(*) FROM compras
UNION ALL SELECT 'refacciones', COUNT(*) FROM refacciones
UNION ALL SELECT 'ventas', COUNT(*) FROM ventas
UNION ALL SELECT 'solicitudes', COUNT(*) FROM solicitudes_venta_vehiculo
UNION ALL SELECT 'notificaciones_no_leidas', COUNT(*) FROM notificaciones WHERE activo=1 AND leida=0
UNION ALL SELECT 'auditoria', COUNT(*) FROM auditoria;

-- Debe devolver 0: publicaciones incompatibles con estado/precio.
SELECT v.id, v.marca, v.modelo, v.estado, v.publicado, v.precio_venta_usd
FROM vehiculos v
WHERE v.publicado=1 AND (v.activo=0 OR v.estado NOT IN ('DISPONIBLE','RESERVADO') OR v.precio_venta_usd<=0);

-- Debe devolver 0: ventas que no están reflejadas como VENDIDO.
SELECT ve.id, ve.marca, ve.modelo, ve.estado, v.id AS venta_id
FROM ventas v JOIN vehiculos ve ON ve.id=v.vehiculo_id
WHERE v.activo=1 AND ve.estado <> 'VENDIDO';

-- Debe devolver 0: snapshots de venta no coinciden con compra + refacciones no canceladas.
SELECT v.id AS venta_id, v.vehiculo_id, v.costo_total_al_vender, calc.costo_calculado
FROM ventas v
JOIN (
  SELECT c.vehiculo_id,
         c.costo_adquisicion + COALESCE(SUM(CASE WHEN r.activo=1 AND r.estado_tarea <> 'CANCELADA'
                                                  THEN r.costo_repuestos+r.costo_mano_obra+r.costo_servicios_externos
                                                  ELSE 0 END),0) AS costo_calculado
  FROM compras c
  LEFT JOIN refacciones r ON r.vehiculo_id=c.vehiculo_id
  WHERE c.activo=1
  GROUP BY c.vehiculo_id, c.costo_adquisicion
) calc ON calc.vehiculo_id=v.vehiculo_id
WHERE v.costo_total_al_vender <> calc.costo_calculado;

-- Dataset útil para capturas: estados presentes.
SELECT estado, COUNT(*) cantidad FROM vehiculos GROUP BY estado ORDER BY estado;
SELECT estado_tarea, COUNT(*) cantidad FROM refacciones GROUP BY estado_tarea ORDER BY estado_tarea;
SELECT estado, COUNT(*) cantidad FROM solicitudes_venta_vehiculo GROUP BY estado ORDER BY estado;

-- Publicaciones suficientes para probar paginación del catálogo (12 por página).
SELECT COUNT(*) AS publicaciones_activas FROM vehiculos WHERE activo=1 AND publicado=1;

-- Usuarios recomendados para pruebas manuales (sin exponer hashes).
SELECT id, username, nombre, activo, debe_cambiar_password FROM usuarios ORDER BY id;
