package uy.edu.ctc.pamahe.modules.reportes.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ReporteCompraItemResponse(
        Long compraId,
        Long vehiculoId,
        String vehiculo,
        LocalDate fechaCompra,
        BigDecimal costoAdquisicion) {
}
