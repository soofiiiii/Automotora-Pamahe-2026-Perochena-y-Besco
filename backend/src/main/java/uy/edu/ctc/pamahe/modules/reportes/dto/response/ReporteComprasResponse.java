package uy.edu.ctc.pamahe.modules.reportes.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ReporteComprasResponse(
        LocalDate desde,
        LocalDate hasta,
        long cantidadCompras,
        BigDecimal inversionCompras,
        List<ReporteCompraItemResponse> compras) {
}
