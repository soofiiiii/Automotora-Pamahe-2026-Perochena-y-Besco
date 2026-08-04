package uy.edu.ctc.pamahe.modules.taller.dto.request;

import java.time.LocalDate;
import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import uy.edu.ctc.pamahe.modules.taller.model.EstadoTarea;
import uy.edu.ctc.pamahe.modules.taller.model.TipoTrabajo;

public record RefaccionUpdateRequest(
        Long responsableOperativoId,
        @NotNull LocalDate fecha,
        @NotNull TipoTrabajo tipoTrabajo,
        @NotBlank String descripcion,
        @PositiveOrZero BigDecimal costoRepuestos,
        @PositiveOrZero BigDecimal costoManoObra,
        @PositiveOrZero BigDecimal costoServiciosExternos,
        @NotNull EstadoTarea estadoTarea,
        String observaciones,
        String registroFotograficoUrl
) {
}