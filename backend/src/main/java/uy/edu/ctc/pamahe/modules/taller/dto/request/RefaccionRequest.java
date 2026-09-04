package uy.edu.ctc.pamahe.modules.taller.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import jakarta.validation.constraints.*;
import uy.edu.ctc.pamahe.modules.taller.model.EstadoTarea;
import uy.edu.ctc.pamahe.modules.taller.model.TipoTrabajo;

public record RefaccionRequest(
        @NotNull Long vehiculoId,
        Long responsableOperativoId,
        @NotNull LocalDate fecha,
        @NotNull TipoTrabajo tipoTrabajo,
        @NotBlank @Size(max = 1000) String descripcion,
        @PositiveOrZero BigDecimal costoRepuestos,
        @PositiveOrZero BigDecimal costoManoObra,
        @PositiveOrZero BigDecimal costoServiciosExternos,
        EstadoTarea estadoTarea,
        @Size(max = 1000) String observaciones,
        @Size(max = 500) String registroFotograficoUrl,
        Boolean sincronizadoDesdeOffline,
        @Size(max = 100) String idOperacionOffline
) {
}
