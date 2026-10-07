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
