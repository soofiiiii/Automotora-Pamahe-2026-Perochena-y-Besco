package uy.edu.ctc.pamahe.modules.parametros.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ParametroRequest(
        @NotBlank @Size(max = 80) String categoria,
        @NotBlank @Size(max = 80) String clave,
        @NotBlank @Size(max = 500) String valor,
        @Size(max = 300) String descripcion) {
}
