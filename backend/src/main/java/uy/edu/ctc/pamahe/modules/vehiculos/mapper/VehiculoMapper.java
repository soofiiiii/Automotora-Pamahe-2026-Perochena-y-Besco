package uy.edu.ctc.pamahe.modules.vehiculos.mapper;

import uy.edu.ctc.pamahe.modules.vehiculos.dto.response.VehiculoResponse;
import uy.edu.ctc.pamahe.modules.vehiculos.model.*;

public final class VehiculoMapper {

    private VehiculoMapper() {
    }

    public static VehiculoResponse toResponse(Vehiculo vehiculo) {
        return new VehiculoResponse(
                vehiculo.getId(),
                vehiculo.getMarca(),
                vehiculo.getModelo(),
                vehiculo.getAnio(),
                vehiculo.getMatricula(),
                vehiculo.getNumeroChasis(),
                vehiculo.getColor(),
                vehiculo.getKilometraje(),
                vehiculo.getEstado(),
                vehiculo.getCostoInicial(),
                vehiculo.getPrecioVentaEstimado(),
                vehiculo.getPublicado(),
                vehiculo.getDescripcionPublica(),
                vehiculo.getObservacionesInternas(),
                vehiculo.getActivo()
        );
    }
}

