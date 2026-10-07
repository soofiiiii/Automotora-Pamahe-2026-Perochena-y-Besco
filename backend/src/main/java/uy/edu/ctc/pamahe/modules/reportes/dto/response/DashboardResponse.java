package uy.edu.ctc.pamahe.modules.reportes.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

public record DashboardResponse(
        long vehiculosActivos,
        long vehiculosEnTaller,
        long vehiculosDisponibles,
        long vehiculosVendidos,
        long tareasTallerPendientes,
        long clientesActivos,
        long ventasRegistradas,
        BigDecimal ingresosVentas,
        BigDecimal rentabilidadAcumulada,
        Map<String, Long> vehiculosPorEstado,
        LocalDate periodoDesde,
        LocalDate periodoHasta,
        long ventasPeriodo,
        BigDecimal ingresosPeriodo,
        BigDecimal rentabilidadPeriodo,
        BigDecimal inversionActualRefacciones
) {
}
