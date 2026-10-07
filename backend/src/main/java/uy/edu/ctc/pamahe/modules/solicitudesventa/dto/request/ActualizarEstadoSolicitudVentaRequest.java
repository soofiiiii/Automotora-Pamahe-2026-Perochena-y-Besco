package uy.edu.ctc.pamahe.modules.solicitudesventa.dto.request;

import jakarta.validation.constraints.NotNull;
import uy.edu.ctc.pamahe.modules.solicitudesventa.model.EstadoSolicitudVenta;

public record ActualizarEstadoSolicitudVentaRequest(
        @NotNull(message = "Seleccioná el estado de revisión.") EstadoSolicitudVenta estado) {
}
