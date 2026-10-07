package uy.edu.ctc.pamahe.modules.vehiculos.dto.response.historial;

import java.util.List;

import uy.edu.ctc.pamahe.modules.imagenes.dto.response.ImagenVehiculoResponse;
import uy.edu.ctc.pamahe.modules.vehiculos.dto.response.VehiculoComercialResponse;
import uy.edu.ctc.pamahe.modules.ventas.dto.response.VentaResponse;

public record VehiculoHistorialComercialResponse(
        VehiculoComercialResponse vehiculo,
        CompraHistorialComercialResponse compra,
        List<RefaccionHistorialComercialResponse> refacciones,
        VentaResponse venta,
        List<ImagenVehiculoResponse> imagenes,
        List<HistorialEventoVehiculoResponse> eventos) {
}
