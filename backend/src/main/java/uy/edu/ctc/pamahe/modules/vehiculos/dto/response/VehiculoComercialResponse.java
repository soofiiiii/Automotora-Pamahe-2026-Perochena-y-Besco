package uy.edu.ctc.pamahe.modules.vehiculos.dto.response;

import uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo;

public record VehiculoComercialResponse(
        Long id,
        String marca,
        String modelo,
        Integer anio,
        String matricula,
        String numeroChasis,
        String color,
        Integer kilometraje,
        EstadoVehiculo estado,
        java.math.BigDecimal precioVentaEstimado,
        Boolean publicado,
        String descripcionPublica,
        Boolean activo
) {
}