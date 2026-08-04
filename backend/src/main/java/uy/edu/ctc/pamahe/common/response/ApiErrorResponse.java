package uy.edu.ctc.pamahe.common.response;

import java.time.Instant;

public record ApiErrorResponse(
        boolean ok,
        String codigo,
        String mensaje,
        Instant fecha,
        String ruta,
        String incidenteId,
        Object detalles
) {
    public static ApiErrorResponse of(String codigo,
                                      String mensaje,
                                      String ruta,
                                      String incidenteId,
                                      Object detalles) {
        return new ApiErrorResponse(false, codigo, mensaje, Instant.now(), ruta, incidenteId, detalles);
    }
}