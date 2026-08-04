package uy.edu.ctc.pamahe.modules.usuarios.dto.request;

import java.util.Set;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

public record UsuarioRequest(
        @NotBlank String username,
        @NotBlank @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres.") String password,
        @NotBlank String nombre,
        @Email @NotBlank String email,
        String telefono,
        @NotEmpty Set<String> roles
) {
}
