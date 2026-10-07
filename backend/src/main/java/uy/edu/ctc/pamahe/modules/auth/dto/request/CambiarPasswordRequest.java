package uy.edu.ctc.pamahe.modules.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CambiarPasswordRequest(
        @NotBlank(message = "Ingresá tu contraseña actual.") String passwordActual,
        @NotBlank(message = "Ingresá la nueva contraseña.")
        @Size(min = 8, max = 72, message = "La nueva contraseña debe tener entre 8 y 72 caracteres.")
        String nuevaPassword
) {
}
