package uy.edu.ctc.pamahe.modules.vehiculos.dto.request;

import jakarta.validation.constraints.NotNull;

public record CambiarPublicacionVehiculoRequest(
    @NotNull Boolean publicado
) {
}
