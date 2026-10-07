package uy.edu.ctc.pamahe.modules.imagenes.dto.request;

import jakarta.validation.constraints.NotNull;

public record ActualizarVisibilidadImagenRequest(
        @NotNull(message = "Indicá si la imagen será pública.") Boolean publica,
        @NotNull(message = "Indicá si la imagen será la principal.") Boolean principal
) {
}
