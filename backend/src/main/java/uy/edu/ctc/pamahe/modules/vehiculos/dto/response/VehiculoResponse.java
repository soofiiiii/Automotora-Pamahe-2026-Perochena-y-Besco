package uy.edu.ctc.pamahe.modules.vehiculos.dto.response;

import uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo;

import java.math.BigDecimal;

public record VehiculoResponse(
        Long id,
        String marca,
        String modelo,
        Integer anio,
        String matricula,
        String numeroChasis,
        String color,
        Integer kilometraje,
        EstadoVehiculo estado,
        BigDecimal costoInicial,
        BigDecimal precioVentaEstimado,
        Boolean publicado,
        String descripcionPublica,
        String observacionesInternas,
        Boolean activo
) {
}