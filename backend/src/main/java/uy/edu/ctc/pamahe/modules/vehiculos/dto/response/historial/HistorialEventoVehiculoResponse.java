package uy.edu.ctc.pamahe.modules.vehiculos.dto.response.historial;

import java.time.LocalDateTime;

/**
 * Evento de estado o publicación incluido en el historial del vehículo.
 * Expone únicamente la información de auditoría necesaria para reconstruir
 * la secuencia funcional comprometida por RF-14.
 */
public record HistorialEventoVehiculoResponse(
        LocalDateTime creadoEn,
        String usuario,
        String accion,
        String detalle,
        String valoresAnteriores,
        String valoresNuevos) {
}
