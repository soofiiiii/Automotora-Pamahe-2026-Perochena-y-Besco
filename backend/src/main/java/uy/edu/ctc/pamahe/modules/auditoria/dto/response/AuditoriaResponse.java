package uy.edu.ctc.pamahe.modules.auditoria.dto.response;

import java.time.LocalDateTime;

public record AuditoriaResponse(
        Long id,
        String usuario,
        String accion,
        String entidad,
        Long entidadId,
        String detalle,
        String valoresAnteriores,
        String valoresNuevos,
        LocalDateTime creadoEn
) {
}
