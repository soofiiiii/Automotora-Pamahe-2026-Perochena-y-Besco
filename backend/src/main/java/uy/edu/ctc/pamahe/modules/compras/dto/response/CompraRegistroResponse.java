package uy.edu.ctc.pamahe.modules.compras.dto.response;

import java.time.LocalDate;

/**
 * Confirmación de registro utilizable por el rol VENDEDOR sin devolver costo de adquisición,
 * comprobante privado ni observaciones financieras de la operación.
 */
public record CompraRegistroResponse(
        Long id,
        Long vehiculoId,
        String vehiculo,
        Long clienteVendedorId,
        String clienteVendedor,
        Long usuarioResponsableId,
        String usuarioResponsable,
        LocalDate fechaCompra
) {
}