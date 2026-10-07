package uy.edu.ctc.pamahe.modules.ventas.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import uy.edu.ctc.pamahe.modules.ventas.model.CanalOrigenVenta;
import uy.edu.ctc.pamahe.modules.ventas.model.EstadoFinanciacion;
import uy.edu.ctc.pamahe.modules.ventas.model.MedioPagoVenta;

public record VentaRequest(
        @NotNull(message = "Seleccioná el vehículo vendido.") @Positive(message = "Seleccioná un vehículo válido.") Long vehiculoId,
        @NotNull(message = "Seleccioná el cliente comprador.") @Positive(message = "Seleccioná un cliente comprador válido.") Long clienteCompradorId,
        @NotNull(message = "La fecha de venta es obligatoria.")
        @PastOrPresent(message = "La fecha de venta no puede ser futura.") LocalDate fechaVenta,
        @NotNull(message = "Ingresá el precio final de venta.")
        @Positive(message = "El precio final debe ser mayor que cero.") BigDecimal precioFinal,
        @NotNull(message = "Seleccioná el medio de pago.") MedioPagoVenta medioPago,
        @Size(max = 120, message = "La entidad financiera no puede superar los 120 caracteres.") String entidadFinanciera,
        @Positive(message = "El monto financiado debe ser mayor que cero.") BigDecimal montoFinanciado,
        EstadoFinanciacion estadoFinanciacion,
        @NotNull(message = "Seleccioná el canal de origen del cliente.") CanalOrigenVenta canalOrigen,
        @NotNull(message = "Confirmá que los datos del comprador fueron verificados.")
        @AssertTrue(message = "Debés verificar los datos del comprador antes de confirmar la venta.") Boolean datosCompradorVerificados,
        @NotNull(message = "Confirmá que la documentación fue revisada.")
        @AssertTrue(message = "Debés revisar la documentación antes de confirmar la venta.") Boolean documentacionRevisada,
        @NotNull(message = "Confirmá el cobro antes de registrar la venta.")
        @AssertTrue(message = "Debés confirmar el cobro antes de registrar la venta.") Boolean cobroConfirmado,
        @FutureOrPresent(message = "La fecha de próximo mantenimiento no puede ser pasada.") LocalDate proximoMantenimiento,
        @Size(max = 1000, message = "Las observaciones no pueden superar los 1000 caracteres.") String observaciones
) {
}
