package uy.edu.ctc.pamahe.modules.ventas.dto.request;

import java.time.LocalDate;

import jakarta.validation.constraints.FutureOrPresent;

/** Permite establecer, reemplazar o limpiar la fecha de próximo mantenimiento. */
public record ActualizarProximoMantenimientoRequest(
        @FutureOrPresent(message = "La fecha de próximo mantenimiento no puede ser pasada.")
        LocalDate proximoMantenimiento
) {
}
