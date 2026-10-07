package uy.edu.ctc.pamahe.modules.ventas.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import uy.edu.ctc.pamahe.modules.ventas.model.CanalOrigenVenta;
import uy.edu.ctc.pamahe.modules.ventas.model.EstadoComprobanteVenta;
import uy.edu.ctc.pamahe.modules.ventas.model.EstadoFinanciacion;
import uy.edu.ctc.pamahe.modules.ventas.model.MedioPagoVenta;

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
        MedioPagoVenta medioPago,
        String entidadFinanciera,
        BigDecimal montoFinanciado,
        EstadoFinanciacion estadoFinanciacion,
        CanalOrigenVenta canalOrigen,
        Boolean seguimientoPostventaRealizado,
        Boolean datosCompradorVerificados,
        Boolean documentacionRevisada,
        Boolean cobroConfirmado,
        LocalDate proximoMantenimiento,
        EstadoComprobanteVenta estadoComprobante,
        Integer intentosComprobante,
        LocalDateTime ultimoIntentoComprobante,
        LocalDateTime proximoIntentoComprobante,
        String comprobanteUrl,
        String observaciones
) {
}
