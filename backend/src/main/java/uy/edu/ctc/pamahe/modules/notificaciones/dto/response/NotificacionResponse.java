package uy.edu.ctc.pamahe.modules.notificaciones.dto.response;

import java.time.LocalDateTime;

import uy.edu.ctc.pamahe.modules.notificaciones.model.TipoNotificacion;

public record NotificacionResponse(
        Long id,
        TipoNotificacion tipo,
        String titulo,
        String mensaje,
        Long vehiculoId,
        Long ventaId,
        Boolean leida,
        String urlDestino,
        LocalDateTime creadaEn
) {
}
