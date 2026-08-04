package uy.edu.ctc.pamahe.modules.imagenes.dto.response;

public record ImagenVehiculoResponse(
        Long id,
        Long vehiculoId,
        String url,
        String descripcion,
        Boolean publica,
        Boolean principal
) {
}

