package uy.edu.ctc.pamahe.modules.roles.dto.response;

public record RolResponse(
        Long id,
        String nombre,
        String descripcion,
        Boolean activo
) {
}
