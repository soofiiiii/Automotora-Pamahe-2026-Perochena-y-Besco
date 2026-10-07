package uy.edu.ctc.pamahe.modules.auth.dto.response;

public record AuditoriaResponse(
        Long id,
        String usuario,
        String accion,
        String entidad,
        Long entidadId,
        String detalle,
        String valoresAnteriores,
        String valoresNuevos,
        Boolean activo
) {
}