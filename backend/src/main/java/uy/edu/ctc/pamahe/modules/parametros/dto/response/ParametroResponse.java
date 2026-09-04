package uy.edu.ctc.pamahe.modules.parametros.dto.response;

public record ParametroResponse(
        Long id,
        String categoria,
        String clave,
        String valor,
        String descripcion,
        Boolean activo) {
}
