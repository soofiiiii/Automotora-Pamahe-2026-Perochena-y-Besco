package uy.edu.ctc.pamahe.modules.vehiculos.dto.response.historial;

import java.util.List;

import uy.edu.ctc.pamahe.modules.compras.dto.response.CompraResponse;
import uy.edu.ctc.pamahe.modules.imagenes.dto.response.ImagenVehiculoResponse;
import uy.edu.ctc.pamahe.modules.taller.dto.response.RefaccionResponse;
import uy.edu.ctc.pamahe.modules.vehiculos.dto.response.VehiculoResponse;
import uy.edu.ctc.pamahe.modules.ventas.dto.response.VentaDetalleGerencialResponse;

public record VehiculoHistorialGerencialResponse(
    VehiculoResponse vehiculo,
    CompraResponse compra,
    List<RefaccionResponse> refacciones,
    VentaDetalleGerencialResponse venta,
    List<ImagenVehiculoResponse> imagenes
) {
}
