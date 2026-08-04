package uy.edu.ctc.pamahe.modules.imagenes.dto.request;

import jakarta.validation.constraints.NotNull;

public record ActualizarVisibilidadImagenRequest(
        @NotNull Boolean publica,
        @NotNull Boolean principal
) {
}

