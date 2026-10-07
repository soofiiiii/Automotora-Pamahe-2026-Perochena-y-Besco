package uy.edu.ctc.pamahe.modules.imagenes.mapper;

import uy.edu.ctc.pamahe.modules.imagenes.dto.response.ImagenVehiculoResponse;
import uy.edu.ctc.pamahe.modules.imagenes.model.ImagenVehiculo;

public final class ImagenVehiculoMapper {

    private ImagenVehiculoMapper() {
    }

    public static ImagenVehiculoResponse toResponse(ImagenVehiculo imagen) {
        return new ImagenVehiculoResponse(
                imagen.getId(),
                imagen.getVehiculo().getId(),
                Boolean.TRUE.equals(imagen.getPublica()) ? imagen.getUrlPublica() : imagen.getUrlInterna(),
                imagen.getDescripcion(),
                imagen.getPublica(),
                imagen.getPrincipal()
        );
    }
}