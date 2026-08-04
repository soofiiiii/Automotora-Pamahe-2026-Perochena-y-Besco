package uy.edu.ctc.pamahe.modules.taller.mapper;

import uy.edu.ctc.pamahe.modules.taller.dto.response.RefaccionResponse;
import uy.edu.ctc.pamahe.modules.taller.model.Refaccion;


public final class RefaccionMapper {

    private RefaccionMapper() {
    }

    public static RefaccionResponse toResponse(Refaccion refaccion) {
        String vehiculo = refaccion.getVehiculo().getMarca() + " "
                + refaccion.getVehiculo().getModelo() + " "
                + refaccion.getVehiculo().getAnio();
        return new RefaccionResponse(
                refaccion.getId(),
                refaccion.getVehiculo().getId(),
                vehiculo.trim(),
                refaccion.getResponsableOperativo() == null ? null : refaccion.getResponsableOperativo().getId(),
                refaccion.getResponsableOperativo() == null ? null : refaccion.getResponsableOperativo().getNombre(),
                refaccion.getUsuarioQueRegistra().getId(),
                refaccion.getUsuarioQueRegistra().getNombre(),
                refaccion.getFecha(),
                refaccion.getTipoTrabajo(),
                refaccion.getDescripcion(),
                refaccion.getCostoRepuestos(),
                refaccion.getCostoManoObra(),
                refaccion.getCostoServiciosExternos(),
                refaccion.costoTotal(),
                refaccion.getEstadoTarea(),
                refaccion.getObservaciones(),
                refaccion.getSincronizadoDesdeOffline(),
                refaccion.getIdOperacionOffline()
        );
    }
}

