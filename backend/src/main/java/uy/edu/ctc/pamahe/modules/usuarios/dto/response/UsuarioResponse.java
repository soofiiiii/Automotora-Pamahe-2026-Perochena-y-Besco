package uy.edu.ctc.pamahe.modules.usuarios.dto.response;

import java.util.Set;

public record UsuarioResponse(
        Long id,
        String username,
        String nombre,
        String email,
        String telefono,
        Boolean activo,
        Set<String> roles
) {
}
