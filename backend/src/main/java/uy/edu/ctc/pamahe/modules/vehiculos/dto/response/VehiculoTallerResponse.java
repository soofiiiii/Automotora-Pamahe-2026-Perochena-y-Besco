package uy.edu.ctc.pamahe.modules.vehiculos.dto.response;

import uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.model.UbicacionVehiculo;

public record VehiculoTallerResponse(
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
        String descripcionPublica,
        Boolean activo
) {
}