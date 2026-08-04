package uy.edu.ctc.pamahe.modules.ventas.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record VentaRequest(
        @NotNull Long vehiculoId,
        @NotNull Long clienteCompradorId,
        @NotNull LocalDate fechaVenta,
        @NotNull @Positive BigDecimal precioFinal,
        String observaciones
) {
}
