package uy.edu.ctc.pamahe.modules.usuarios.dto.request;

import java.util.Set;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UsuarioUpdateRequest(
        @NotBlank @Size(max = 120) String nombre,
        @Email @NotBlank @Size(max = 120) String email,
        @Pattern(regexp = "^\\+?[0-9 ()-]{8,40}$", message = "El teléfono no tiene un formato válido.")
        @Size(max = 40) String telefono,
        @NotEmpty Set<@NotBlank @Size(max = 50) String> roles,
        Boolean activo) {
}

