package uy.edu.ctc.pamahe.modules.ventas.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record VentaResponse(
        Long id,
        Long vehiculoId,
        String vehiculo,
        Long clienteCompradorId,
        String clienteComprador,
        Long vendedorId,
        String vendedor,
        LocalDate fechaVenta,
        BigDecimal precioFinal,
        String comprobanteUrl,
        String observaciones
) {
}