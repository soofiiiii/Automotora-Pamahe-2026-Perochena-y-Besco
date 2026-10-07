package uy.edu.ctc.pamahe.modules.parametros.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ParametroRequest(
        @NotBlank(message = "La categoría es obligatoria.")
        @Size(max = 80, message = "La categoría no puede superar los 80 caracteres.") String categoria,
        @NotBlank(message = "La clave es obligatoria.")
        @Size(max = 80, message = "La clave no puede superar los 80 caracteres.") String clave,
        @NotBlank(message = "El valor es obligatorio.")
        @Size(max = 500, message = "El valor no puede superar los 500 caracteres.") String valor,
        @Size(max = 300, message = "La descripción no puede superar los 300 caracteres.") String descripcion) {
}
