INSERT INTO parametros (categoria, clave, valor, descripcion)
VALUES (
    'CONTACTO',
    'HORARIO',
    'Nuestro horario de atención es de lunes a viernes de 9:00 a 12:00 y de 14:30 a 19:30. Los sábados atendemos de 10:00 a 13:30. Los domingos no contamos con atención al público.',
    'Horario comercial utilizado por el chatbot y el frontend'
)
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

CREATE INDEX idx_auditoria_usuario_accion_fecha ON auditoria(usuario, accion, creado_en);
