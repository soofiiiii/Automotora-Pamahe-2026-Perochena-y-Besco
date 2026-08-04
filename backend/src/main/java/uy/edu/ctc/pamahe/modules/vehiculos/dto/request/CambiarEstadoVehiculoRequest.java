package uy.edu.ctc.pamahe.modules.vehiculos.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo;

public record CambiarEstadoVehiculoRequest(
        @NotNull EstadoVehiculo estado,
        @Size(max = 500) String motivo
) {
}

