package uy.edu.ctc.pamahe.modules.reportes.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

import uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo;

public record ReporteVehiculoStockItemResponse(
        Long vehiculoId,
        String marca,
        String modelo,
        Integer anio,
        String tipoVehiculo,
        EstadoVehiculo estado,
        Boolean publicado,
        BigDecimal precioVentaEstimado,
        LocalDate fechaIngreso) {
}
