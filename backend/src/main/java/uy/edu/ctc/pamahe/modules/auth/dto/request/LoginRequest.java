package uy.edu.ctc.pamahe.modules.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "Ingresá tu usuario.")
        @Size(max = 60, message = "El usuario no puede superar los 60 caracteres.")
        String username,
        @NotBlank(message = "Ingresá tu contraseña.")
        @Size(max = 72, message = "La contraseña no puede superar los 72 caracteres.")
        String password) {
}
