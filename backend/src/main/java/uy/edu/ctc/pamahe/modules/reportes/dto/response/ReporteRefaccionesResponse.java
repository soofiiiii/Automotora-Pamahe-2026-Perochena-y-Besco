package uy.edu.ctc.pamahe.modules.reportes.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ReporteRefaccionesResponse(
        LocalDate desde,
        LocalDate hasta,
        long cantidadRefacciones,
        BigDecimal costoRepuestos,
        BigDecimal costoManoObra,
        BigDecimal costoServiciosExternos,
        BigDecimal costoTotal,
        List<ReporteRefaccionItemResponse> refacciones) {
}
