package uy.edu.ctc.pamahe.modules.vehiculos.dto.response.historial;

import java.time.LocalDate;

public record CompraHistorialComercialResponse(
    Long id,
    Long clienteVendedorId,
    String clienteVendedor,
    LocalDate fechaCompra
) {
    
}
