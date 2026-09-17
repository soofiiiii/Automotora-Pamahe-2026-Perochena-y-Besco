package uy.edu.ctc.pamahe.modules.reportes.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

import uy.edu.ctc.pamahe.modules.taller.model.EstadoTarea;
import uy.edu.ctc.pamahe.modules.taller.model.TipoTrabajo;

public record ReporteRefaccionItemResponse(
        Long refaccionId,
        Long vehiculoId,
        String vehiculo,
        LocalDate fecha,
        TipoTrabajo tipoTrabajo,
        EstadoTarea estadoTarea,
        BigDecimal costoRepuestos,
        BigDecimal costoManoObra,
        BigDecimal costoServiciosExternos,
        BigDecimal costoTotal) {
}
