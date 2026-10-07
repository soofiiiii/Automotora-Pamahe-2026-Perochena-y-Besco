package uy.edu.ctc.pamahe.modules.solicitudesventa.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import uy.edu.ctc.pamahe.modules.solicitudesventa.model.EstadoSolicitudVenta;

public record SolicitudVentaDetalleResponse(
        Long id,
        String nombre,
        String telefono,
        String marca,
        String modelo,
        Integer anio,
        Integer kilometraje,
        String observaciones,
        EstadoSolicitudVenta estado,
        Long revisadaPorId,
        String revisadaPor,
        LocalDateTime revisadaEn,
        LocalDateTime creadaEn,
        List<SolicitudVentaImagenResponse> fotografias) {
}
