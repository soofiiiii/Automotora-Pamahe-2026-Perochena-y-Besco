package uy.edu.ctc.pamahe.modules.usuarios.dto.request;

import java.util.Set;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UsuarioRequest(
        @NotBlank(message = "El nombre de usuario es obligatorio.")
        @Size(max = 60, message = "El nombre de usuario no puede superar los 60 caracteres.") String username,
        @NotBlank(message = "La contraseña es obligatoria.")
        @Size(min = 8, max = 72, message = "La contraseña debe tener entre 8 y 72 caracteres.") String password,
        @NotBlank(message = "El nombre es obligatorio.")
        @Size(max = 120, message = "El nombre no puede superar los 120 caracteres.") String nombre,
        @Email(message = "Ingresá un email válido.")
        @NotBlank(message = "El email es obligatorio.")
        @Size(max = 120, message = "El email no puede superar los 120 caracteres.") String email,
        @Pattern(regexp = "^\\+?[0-9 ()-]{8,40}$", message = "El teléfono no tiene un formato válido.")
        @Size(max = 40, message = "El teléfono no puede superar los 40 caracteres.") String telefono,
        @NotEmpty(message = "Elegí al menos un rol.")
        Set<@NotBlank(message = "El rol no puede estar vacío.") @Size(max = 50, message = "El rol seleccionado no es válido.") String> roles
) {
}
