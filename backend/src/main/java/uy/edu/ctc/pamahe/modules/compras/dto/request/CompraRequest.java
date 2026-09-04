package uy.edu.ctc.pamahe.modules.compras.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CompraRequest(
        @NotNull Long vehiculoId,
        @NotNull Long clienteVendedorId,
        @NotNull LocalDate fechaCompra,
        @NotNull @Positive BigDecimal costoAdquisicion,
        @Size(max = 1000) String observaciones
) {
}