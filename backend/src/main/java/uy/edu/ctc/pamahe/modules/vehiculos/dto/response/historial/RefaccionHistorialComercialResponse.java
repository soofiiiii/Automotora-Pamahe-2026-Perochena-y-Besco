package uy.edu.ctc.pamahe.modules.vehiculos.dto.response.historial;

import java.time.LocalDate;

import uy.edu.ctc.pamahe.modules.taller.model.EstadoTarea;
import uy.edu.ctc.pamahe.modules.taller.model.TipoTrabajo;

public record RefaccionHistorialComercialResponse(
    Long id,
    LocalDate fecha,
    TipoTrabajo tipoTrabajo,
    String descripcion,
    EstadoTarea estadoTarea
) {
    
}
