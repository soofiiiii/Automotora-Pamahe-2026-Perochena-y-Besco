package uy.edu.ctc.pamahe.modules.compras.dto.response;

import uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo;

public record DestinoPostCompraResponse(
        Long compraId,
        Long vehiculoId,
        EstadoVehiculo estadoVehiculo
) {
}
