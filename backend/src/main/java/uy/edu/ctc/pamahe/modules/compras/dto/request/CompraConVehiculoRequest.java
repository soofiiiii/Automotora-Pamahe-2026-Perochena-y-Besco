package uy.edu.ctc.pamahe.modules.compras.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import uy.edu.ctc.pamahe.modules.vehiculos.dto.request.VehiculoRequest;

public record CompraConVehiculoRequest(
        @NotNull(message = "Ingresá los datos del vehículo.")
        @Valid VehiculoRequest vehiculo,
        @NotNull(message = "Seleccioná el cliente vendedor.")
        @Positive(message = "Seleccioná un cliente vendedor válido.") Long clienteVendedorId,
        @NotNull(message = "La fecha de compra es obligatoria.")
        @PastOrPresent(message = "La fecha de compra no puede ser futura.") LocalDate fechaCompra,
        @NotNull(message = "Ingresá el costo de adquisición.")
        @Positive(message = "El costo de adquisición debe ser mayor que cero.") BigDecimal costoAdquisicion,
        @Size(max = 1000, message = "Las observaciones no pueden superar los 1000 caracteres.") String observaciones
) {
}
