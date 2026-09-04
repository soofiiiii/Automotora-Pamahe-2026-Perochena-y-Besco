package uy.edu.ctc.pamahe.modules.taller.dto.request;

import java.time.LocalDate;
import java.math.BigDecimal;
import jakarta.validation.constraints.*;
import uy.edu.ctc.pamahe.modules.taller.model.EstadoTarea;
import uy.edu.ctc.pamahe.modules.taller.model.TipoTrabajo;

public record RefaccionUpdateRequest(
        Long responsableOperativoId,
        @NotNull LocalDate fecha,
        @NotNull TipoTrabajo tipoTrabajo,
        @NotBlank @Size(max = 1000) String descripcion,
        @PositiveOrZero BigDecimal costoRepuestos,
        @PositiveOrZero BigDecimal costoManoObra,
        @PositiveOrZero BigDecimal costoServiciosExternos,
        @NotNull EstadoTarea estadoTarea,
        @Size(max = 1000) String observaciones,
        @Size(max = 500) String registroFotograficoUrl
) {
}
