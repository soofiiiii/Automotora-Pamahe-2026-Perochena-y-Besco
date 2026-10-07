package uy.edu.ctc.pamahe.modules.ventas.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import uy.edu.ctc.pamahe.modules.ventas.model.EstadoFinanciacion;

public record ActualizarFinanciacionVentaRequest(
        @NotBlank(message = "Ingresá la entidad financiera.")
        @Size(max = 120, message = "La entidad financiera no puede superar los 120 caracteres.") String entidadFinanciera,
        @NotNull(message = "Ingresá el monto financiado.")
        @Positive(message = "El monto financiado debe ser mayor que cero.") BigDecimal montoFinanciado,
        @NotNull(message = "Seleccioná el estado de la financiación.") EstadoFinanciacion estado) {
}
