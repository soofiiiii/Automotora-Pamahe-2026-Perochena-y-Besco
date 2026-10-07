package uy.edu.ctc.pamahe.modules.taller.dto.request;

import java.time.LocalDate;
import java.math.BigDecimal;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import uy.edu.ctc.pamahe.modules.taller.model.EstadoTarea;
import uy.edu.ctc.pamahe.modules.taller.model.TipoTrabajo;

public record RefaccionUpdateRequest(
        @Positive(message = "Seleccioná un responsable válido.") Long responsableOperativoId,
        @NotNull(message = "La fecha del trabajo es obligatoria.")
        @PastOrPresent(message = "La fecha del trabajo no puede ser futura.") LocalDate fecha,
        @NotNull(message = "Seleccioná el tipo de trabajo.") TipoTrabajo tipoTrabajo,
        @NotBlank(message = "Describí el trabajo realizado.")
        @Size(max = 1000, message = "La descripción no puede superar los 1000 caracteres.") String descripcion,
        @PositiveOrZero(message = "El costo de repuestos no puede ser negativo.") BigDecimal costoRepuestos,
        @PositiveOrZero(message = "El costo de mano de obra no puede ser negativo.") BigDecimal costoManoObra,
        @PositiveOrZero(message = "El costo de servicios externos no puede ser negativo.") BigDecimal costoServiciosExternos,
        @NotNull(message = "Seleccioná el estado de la tarea.") EstadoTarea estadoTarea,
        @Size(max = 1000, message = "Las observaciones no pueden superar los 1000 caracteres.") String observaciones,
        @Size(max = 500, message = "La referencia fotográfica no puede superar los 500 caracteres.") String registroFotograficoUrl
) {
}
