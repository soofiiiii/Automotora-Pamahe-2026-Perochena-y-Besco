package uy.edu.ctc.pamahe.modules.reportes.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ReporteVentasResponse(
        LocalDate desde,
        LocalDate hasta,
        long cantidadVentas,
        BigDecimal ingresos,
        BigDecimal costoTotal,
        BigDecimal rentabilidad,
        List<ReporteVentaItemResponse> ventas) {
}
