package uy.edu.ctc.pamahe.modules.reportes.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ReporteVentaItemResponse(
        Long ventaId,
        Long vehiculoId,
        String vehiculo,
        LocalDate fechaVenta,
        BigDecimal precioFinal,
        BigDecimal costoTotal,
        BigDecimal rentabilidad) {
}
