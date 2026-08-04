package uy.edu.ctc.pamahe.modules.taller.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import uy.edu.ctc.pamahe.modules.taller.model.EstadoTarea;
import uy.edu.ctc.pamahe.modules.taller.model.TipoTrabajo;

public record RefaccionRequest(
        @NotNull Long vehiculoId,
        Long responsableOperativoId,
        @NotNull LocalDate fecha,
        @NotNull TipoTrabajo tipoTrabajo,
        @NotBlank String descripcion,
        @PositiveOrZero BigDecimal costoRepuestos,
        @PositiveOrZero BigDecimal costoManoObra,
        @PositiveOrZero BigDecimal costoServiciosExternos,
        EstadoTarea estadoTarea,
        String observaciones,
        String registroFotograficoUrl,
        Boolean sincronizadoDesdeOffline,
        @Size(max = 100) String idOperacionOffline
) {
}
