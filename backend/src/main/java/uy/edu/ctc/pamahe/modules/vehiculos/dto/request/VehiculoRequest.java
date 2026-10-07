package uy.edu.ctc.pamahe.modules.vehiculos.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

import uy.edu.ctc.pamahe.modules.vehiculos.model.UbicacionVehiculo;

public record VehiculoRequest(
        @NotBlank(message = "La marca es obligatoria.")
        @Size(max = 80, message = "La marca no puede superar los 80 caracteres.") String marca,
        @NotBlank(message = "El modelo es obligatorio.")
        @Size(max = 80, message = "El modelo no puede superar los 80 caracteres.") String modelo,
        @Size(max = 50, message = "El tipo de vehículo no puede superar los 50 caracteres.") String tipoVehiculo,
        @NotNull(message = "El año es obligatorio.")
        @Min(value = 1900, message = "El año no puede ser anterior a 1900.")
        @Max(value = 2100, message = "El año no puede ser posterior a 2100.") Integer anio,
        @Size(max = 30, message = "La matrícula no puede superar los 30 caracteres.") String matricula,
        @Size(max = 80, message = "El número de chasis no puede superar los 80 caracteres.") String numeroChasis,
        @Size(max = 60, message = "El color no puede superar los 60 caracteres.") String color,
        @PositiveOrZero(message = "El kilometraje no puede ser negativo.") Integer kilometraje,
        @NotNull(message = "Seleccioná la ubicación física actual del vehículo.") UbicacionVehiculo ubicacionActual,
        @DecimalMin(value = "0.0", inclusive = true, message = "El precio en USD no puede ser negativo.") BigDecimal precioVentaUsd,
        @DecimalMin(value = "0.0", inclusive = true, message = "El precio estimado no puede ser negativo.") BigDecimal precioVentaEstimado,
        @Size(max = 1000, message = "La descripción pública no puede superar los 1000 caracteres.") String descripcionPublica,
        @Size(max = 1000, message = "Las observaciones internas no pueden superar los 1000 caracteres.") String observacionesInternas
) {
    /** Mantiene compatibilidad fuente con llamadas internas que todavía construyen el DTO con el precio UYU legado. */
    public VehiculoRequest(
            String marca,
            String modelo,
            String tipoVehiculo,
            Integer anio,
            String matricula,
            String numeroChasis,
            String color,
            Integer kilometraje,
            UbicacionVehiculo ubicacionActual,
            BigDecimal precioVentaEstimado,
            String descripcionPublica,
            String observacionesInternas) {
        this(marca, modelo, tipoVehiculo, anio, matricula, numeroChasis, color, kilometraje,
                ubicacionActual, null, precioVentaEstimado, descripcionPublica, observacionesInternas);
    }
}
