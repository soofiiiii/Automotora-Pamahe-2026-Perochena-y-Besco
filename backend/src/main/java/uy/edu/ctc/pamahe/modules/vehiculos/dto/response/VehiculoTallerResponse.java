package uy.edu.ctc.pamahe.modules.vehiculos.dto.response;

import uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo;

public record VehiculoTallerResponse(
        Long id,
        String marca,
        String modelo,
        Integer anio,
        String matricula,
        String numeroChasis,
        String color,
        Integer kilometraje,
        EstadoVehiculo estado,
        String descripcionPublica,
        Boolean activo
) {
}