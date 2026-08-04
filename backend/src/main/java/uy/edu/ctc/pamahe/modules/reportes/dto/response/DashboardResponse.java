package uy.edu.ctc.pamahe.modules.reportes.dto.response;

import java.math.BigDecimal;
import java.util.Map;

public record DashboardResponse(
        long vehiculosActivos,
        long vehiculosEnTaller,
        long vehiculosDisponibles,
        long vehiculosVendidos,
        long clientesActivos,
        long ventasRegistradas,
        BigDecimal ingresosVentas,
        BigDecimal rentabilidadAcumulada,
        Map<String, Long> vehiculosPorEstado
) {
}
