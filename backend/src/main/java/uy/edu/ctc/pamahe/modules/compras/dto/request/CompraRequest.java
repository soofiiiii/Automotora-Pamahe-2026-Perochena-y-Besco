package uy.edu.ctc.pamahe.modules.compras.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CompraRequest(
        @NotNull Long vehiculoId,
        @NotNull Long clienteVendedorId,
        @NotNull LocalDate fechaCompra,
        @NotNull @Positive BigDecimal costoAdquisicion,
        String observaciones
) {
}