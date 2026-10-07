package uy.edu.ctc.pamahe.modules.vehiculos.dto.request;

import jakarta.validation.constraints.NotNull;

public record CambiarPublicacionVehiculoRequest(
    @NotNull(message = "Indicá si el vehículo debe mostrarse en el catálogo.") Boolean publicado
) {
}
