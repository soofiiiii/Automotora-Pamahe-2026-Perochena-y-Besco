package uy.edu.ctc.pamahe.modules.vehiculos.mapper;

import uy.edu.ctc.pamahe.modules.vehiculos.dto.response.VehiculoComercialResponse;
import uy.edu.ctc.pamahe.modules.vehiculos.dto.response.VehiculoResponse;
import uy.edu.ctc.pamahe.modules.vehiculos.dto.response.VehiculoTallerResponse;
import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;

public final class VehiculoMapper {

    private VehiculoMapper() {
    }

    /**
     * Respuesta completa para ADMINISTRADOR y DUEÑO.
     */
    public static VehiculoResponse toResponse(Vehiculo vehiculo) {
        return new VehiculoResponse(
                vehiculo.getId(),
                vehiculo.getMarca(),
                vehiculo.getModelo(),
                vehiculo.getTipoVehiculo(),
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

    /**
     * Respuesta comercial para VENDEDOR.
     *
     * No expone:
     * - costoInicial
     * - observacionesInternas
     */
    public static VehiculoComercialResponse toComercialResponse(Vehiculo vehiculo) {
        return new VehiculoComercialResponse(
                vehiculo.getId(),
                vehiculo.getMarca(),
                vehiculo.getModelo(),
                vehiculo.getTipoVehiculo(),
                vehiculo.getAnio(),
                vehiculo.getMatricula(),
                vehiculo.getNumeroChasis(),
                vehiculo.getColor(),
                vehiculo.getKilometraje(),
                vehiculo.getEstado(),
                vehiculo.getPrecioVentaEstimado(),
                vehiculo.getPublicado(),
                vehiculo.getDescripcionPublica(),
                vehiculo.getActivo()
        );
    }

    /**
     * Respuesta técnica/operativa para TALLER.
     *
     * No expone información económica ni observaciones internas.
     */
    public static VehiculoTallerResponse toTallerResponse(Vehiculo vehiculo) {
        return new VehiculoTallerResponse(
                vehiculo.getId(),
                vehiculo.getMarca(),
                vehiculo.getModelo(),
                vehiculo.getTipoVehiculo(),
                vehiculo.getAnio(),
                vehiculo.getMatricula(),
                vehiculo.getNumeroChasis(),
                vehiculo.getColor(),
                vehiculo.getKilometraje(),
                vehiculo.getEstado(),
                vehiculo.getDescripcionPublica(),
                vehiculo.getActivo()
        );
    }
}