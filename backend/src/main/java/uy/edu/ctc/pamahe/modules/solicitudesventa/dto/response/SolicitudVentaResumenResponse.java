package uy.edu.ctc.pamahe.modules.solicitudesventa.dto.response;

import java.time.LocalDateTime;
import uy.edu.ctc.pamahe.modules.solicitudesventa.model.EstadoSolicitudVenta;

public record SolicitudVentaResumenResponse(
        Long id,
        String nombre,
        String telefono,
        String marca,
        String modelo,
        Integer anio,
        Integer kilometraje,
        EstadoSolicitudVenta estado,
        long cantidadFotografias,
        LocalDateTime creadaEn) {
}
