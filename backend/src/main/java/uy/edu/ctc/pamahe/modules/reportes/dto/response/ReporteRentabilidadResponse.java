package uy.edu.ctc.pamahe.modules.reportes.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ReporteRentabilidadResponse(
        LocalDate desde,
        LocalDate hasta,
        long vehiculosVendidos,
        BigDecimal ingresos,
        BigDecimal costoTotal,
        BigDecimal rentabilidad,
        BigDecimal margenPorcentual,
        List<ReporteVentaItemResponse> operaciones) {
}
