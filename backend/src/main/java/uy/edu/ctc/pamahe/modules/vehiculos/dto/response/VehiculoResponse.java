package uy.edu.ctc.pamahe.modules.vehiculos.dto.response;

import uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.model.UbicacionVehiculo;

import java.math.BigDecimal;

public record VehiculoResponse(
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
        BigDecimal costoInicial,
        BigDecimal precioVentaUsd,
        BigDecimal precioVentaEstimado,
        Boolean publicado,
        String descripcionPublica,
        String observacionesInternas,
        Boolean activo
) {
}
