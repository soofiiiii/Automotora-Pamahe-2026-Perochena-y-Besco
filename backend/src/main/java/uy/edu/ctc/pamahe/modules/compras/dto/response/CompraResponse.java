package uy.edu.ctc.pamahe.modules.compras.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CompraResponse(
        Long id,
        Long vehiculoId,
        String vehiculo,
        Long clienteVendedorId,
        String clienteVendedor,
        Long usuarioResponsableId,
        String usuarioResponsable,
        LocalDate fechaCompra,
        BigDecimal costoAdquisicion,
        String comprobanteUrl,
        String observaciones
) {
}


