package uy.edu.ctc.pamahe.modules.usuarios.dto.request;

import java.util.Set;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

public record UsuarioUpdateRequest(
        @NotBlank String nombre,
        @Email @NotBlank String email,
        String telefono,
        @NotEmpty Set<String> roles,
        Boolean activo) {

}
