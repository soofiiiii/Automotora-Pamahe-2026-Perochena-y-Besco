package uy.edu.ctc.pamahe.modules.solicitudesventa.dto.response;

import java.time.LocalDateTime;
import uy.edu.ctc.pamahe.modules.solicitudesventa.model.EstadoSolicitudVenta;

public record SolicitudVentaPublicaResponse(
        Long id,
        EstadoSolicitudVenta estado,
        LocalDateTime creadaEn) {
}
