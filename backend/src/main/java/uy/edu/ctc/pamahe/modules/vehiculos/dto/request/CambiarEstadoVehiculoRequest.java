package uy.edu.ctc.pamahe.modules.vehiculos.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo;

public record CambiarEstadoVehiculoRequest(
        @NotNull(message = "Seleccioná el nuevo estado del vehículo.") EstadoVehiculo estado,
        @Size(max = 500, message = "El motivo no puede superar los 500 caracteres.") String motivo
) {
}
