package uy.edu.ctc.pamahe.modules.reportes.dto.response;

import java.time.LocalDate;
import java.util.List;

/**
 * Reporte de inventario para un período.
 *
 * vehiculosIngresados cuenta las compras realizadas dentro del rango solicitado.
 * stockAlCierre cuenta las unidades compradas hasta "hasta" que todavía no habían sido vendidas
 * a esa fecha. Los campos estado/publicado de cada item representan el valor operativo actual,
 * porque el modelo no conserva snapshots históricos de cada transición de estado/publicación.
 */
public record ReporteStockResponse(
        LocalDate desde,
        LocalDate hasta,
        long vehiculosIngresados,
        long stockAlCierre,
        long disponibles,
        long publicados,
        boolean estadoYPublicacionRepresentanSituacionActual,
        List<ReporteVehiculoStockItemResponse> vehiculos) {
}
