package uy.edu.ctc.pamahe.modules.usuarios.mapper;

import java.util.stream.Collectors;

import uy.edu.ctc.pamahe.modules.usuarios.dto.response.UsuarioResponse;
import uy.edu.ctc.pamahe.modules.usuarios.model.Usuario;

public final class UsuarioMapper {

    private UsuarioMapper() {}

    public static UsuarioResponse toResponse(Usuario usuario) {
        return new UsuarioResponse(
                usuario.getId(),
                usuario.getUsername(),
                usuario.getNombre(),
                usuario.getEmail(),
                usuario.getTelefono(),
                usuario.getActivo(),
                usuario.getDebeCambiarPassword(),
                usuario.getRoles().stream().map(rol -> rol.getNombre()).collect(Collectors.toSet())
        );
    }
}

