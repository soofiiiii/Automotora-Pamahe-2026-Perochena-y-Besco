package uy.edu.ctc.pamahe.modules.vehiculos.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record VehiculoRequest(
        @NotBlank @Size(max = 80) String marca,
        @NotBlank @Size(max = 80) String modelo,
        @Size(max = 50) String tipoVehiculo,
        @NotNull @Min(1900) @Max(2100) Integer anio,
        @Size(max = 30) String matricula,
        @Size(max = 80) String numeroChasis,
        @Size(max = 60) String color,
        @PositiveOrZero Integer kilometraje,
        @DecimalMin(value = "0.0", inclusive = true) BigDecimal precioVentaEstimado,
        @Size(max = 1000) String descripcionPublica,
        @Size(max = 1000) String observacionesInternas
) {
}
