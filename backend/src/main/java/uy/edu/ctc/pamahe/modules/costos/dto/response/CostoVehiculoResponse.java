package uy.edu.ctc.pamahe.modules.costos.dto.response;

import java.math.BigDecimal;

public record CostoVehiculoResponse(
        Long vehiculoId,
        BigDecimal costoCompra,
        BigDecimal costoRefacciones,
        BigDecimal costoTotal,
        BigDecimal precioVentaFinal,
        BigDecimal rentabilidad,
        boolean historicoCerrado
) {
}

