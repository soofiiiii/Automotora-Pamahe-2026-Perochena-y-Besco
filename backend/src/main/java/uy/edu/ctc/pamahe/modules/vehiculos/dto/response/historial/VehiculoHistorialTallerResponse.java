package uy.edu.ctc.pamahe.modules.vehiculos.dto.response.historial;

import java.time.LocalDate;
import java.util.List;

import uy.edu.ctc.pamahe.modules.imagenes.dto.response.ImagenVehiculoResponse;
import uy.edu.ctc.pamahe.modules.taller.dto.response.RefaccionResponse;
import uy.edu.ctc.pamahe.modules.vehiculos.dto.response.VehiculoTallerResponse;

public record VehiculoHistorialTallerResponse(
        VehiculoTallerResponse vehiculo,
        LocalDate fechaCompra,
        List<RefaccionResponse> refacciones,
        LocalDate fechaVenta,
        List<ImagenVehiculoResponse> imagenes
) {
}
