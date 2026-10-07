package uy.edu.ctc.pamahe.modules.vehiculos.dto.response;

import uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.model.UbicacionVehiculo;

public record VehiculoComercialResponse(
        Long id,
        String marca,
        String modelo,
        String tipoVehiculo,
        String tipoVehiculoLabel,
        Integer anio,
        String matricula,
        String numeroChasis,
        String color,
        Integer kilometraje,
        EstadoVehiculo estado,
        UbicacionVehiculo ubicacionActual,
        java.math.BigDecimal precioVentaUsd,
        java.math.BigDecimal precioVentaEstimado,
        Boolean publicado,
        String descripcionPublica,
        Boolean activo
) {
}
