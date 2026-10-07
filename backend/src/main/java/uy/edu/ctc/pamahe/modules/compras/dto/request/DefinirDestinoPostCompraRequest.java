package uy.edu.ctc.pamahe.modules.compras.dto.request;

import jakarta.validation.constraints.NotNull;

public record DefinirDestinoPostCompraRequest(
        @NotNull(message = "Seleccioná qué debe ocurrir con el vehículo después de la compra.")
        DestinoPostCompra destino
) {
}
