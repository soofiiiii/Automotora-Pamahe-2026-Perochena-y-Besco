package uy.edu.ctc.pamahe.modules.ventas.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record VentaDetalleGerencialResponse(
        Long id,
        Long vehiculoId,
        String vehiculo,
        Long clienteCompradorId,
        String clienteComprador,
        Long vendedorId,
        String vendedor,
        LocalDate fechaVenta,
        BigDecimal costoCompraAlVender,
        BigDecimal costoRefaccionesAlVender,
        BigDecimal costoTotalAlVender,
        BigDecimal precioFinal,
        BigDecimal rentabilidadCalculada,
        String comprobanteUrl,
        String observaciones
) {
}

