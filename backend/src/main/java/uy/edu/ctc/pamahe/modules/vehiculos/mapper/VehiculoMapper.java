package uy.edu.ctc.pamahe.modules.vehiculos.mapper;

import uy.edu.ctc.pamahe.modules.vehiculos.dto.response.VehiculoComercialResponse;
import uy.edu.ctc.pamahe.modules.vehiculos.dto.response.VehiculoResponse;
import uy.edu.ctc.pamahe.modules.vehiculos.dto.response.VehiculoTallerResponse;
import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;

public final class VehiculoMapper {

    private VehiculoMapper() {
    }

    public static VehiculoResponse toResponse(Vehiculo vehiculo) {
        return toResponse(vehiculo, vehiculo.getTipoVehiculo());
    }

    public static VehiculoResponse toResponse(Vehiculo vehiculo, String tipoVehiculoLabel) {
        return new VehiculoResponse(
                vehiculo.getId(),
                vehiculo.getMarca(),
                vehiculo.getModelo(),
                vehiculo.getTipoVehiculo(),
                tipoVehiculoLabel,
                vehiculo.getAnio(),
                vehiculo.getMatricula(),
                vehiculo.getNumeroChasis(),
                vehiculo.getColor(),
                vehiculo.getKilometraje(),
                vehiculo.getEstado(),
                vehiculo.getUbicacionActual(),
                vehiculo.getCostoInicial(),
                vehiculo.getPrecioVentaUsd(),
                vehiculo.getPrecioVentaEstimado(),
                vehiculo.getPublicado(),
                vehiculo.getDescripcionPublica(),
                vehiculo.getObservacionesInternas(),
                vehiculo.getActivo());
    }

    public static VehiculoComercialResponse toComercialResponse(Vehiculo vehiculo) {
        return toComercialResponse(vehiculo, vehiculo.getTipoVehiculo());
    }

    public static VehiculoComercialResponse toComercialResponse(Vehiculo vehiculo, String tipoVehiculoLabel) {
        return new VehiculoComercialResponse(
                vehiculo.getId(),
                vehiculo.getMarca(),
                vehiculo.getModelo(),
                vehiculo.getTipoVehiculo(),
                tipoVehiculoLabel,
                vehiculo.getAnio(),
                vehiculo.getMatricula(),
                vehiculo.getNumeroChasis(),
                vehiculo.getColor(),
                vehiculo.getKilometraje(),
                vehiculo.getEstado(),
                vehiculo.getUbicacionActual(),
                vehiculo.getPrecioVentaUsd(),
                vehiculo.getPrecioVentaEstimado(),
                vehiculo.getPublicado(),
                vehiculo.getDescripcionPublica(),
                vehiculo.getActivo());
    }

    public static VehiculoTallerResponse toTallerResponse(Vehiculo vehiculo) {
        return toTallerResponse(vehiculo, vehiculo.getTipoVehiculo());
    }

    public static VehiculoTallerResponse toTallerResponse(Vehiculo vehiculo, String tipoVehiculoLabel) {
        return new VehiculoTallerResponse(
                vehiculo.getId(),
                vehiculo.getMarca(),
                vehiculo.getModelo(),
                vehiculo.getTipoVehiculo(),
                tipoVehiculoLabel,
                vehiculo.getAnio(),
                vehiculo.getMatricula(),
                vehiculo.getNumeroChasis(),
                vehiculo.getColor(),
                vehiculo.getKilometraje(),
                vehiculo.getEstado(),
                vehiculo.getUbicacionActual(),
                vehiculo.getDescripcionPublica(),
                vehiculo.getActivo());
    }
}
