package uy.edu.ctc.pamahe.modules.vehiculos.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record VehiculoRequest(
        @NotBlank String marca,
        @NotBlank String modelo,
        @NotNull @Min(1900) @Max(2100) Integer anio,
        String matricula,
        String numeroChasis,
        String color,
        @PositiveOrZero Integer kilometraje,
        @DecimalMin(value = "0.0", inclusive = true) BigDecimal precioVentaEstimado,
        String descripcionPublica,
        String observacionesInternas
) {
}
