package uy.edu.ctc.pamahe.modules.compras.mapper;

import uy.edu.ctc.pamahe.modules.compras.dto.response.CompraResponse;
import uy.edu.ctc.pamahe.modules.compras.model.Compra;

public final class CompraMapper {

    private CompraMapper() {
    }

    public static CompraResponse toResponse(Compra compra) {
        String vehiculo = compra.getVehiculo().getMarca() + " " + compra.getVehiculo().getModelo() + " " + compra.getVehiculo().getAnio();
        String cliente = compra.getClienteVendedor().getNombre() + " "
                + (compra.getClienteVendedor().getApellido() == null ? "" : compra.getClienteVendedor().getApellido());
        return new CompraResponse(
                compra.getId(),
                compra.getVehiculo().getId(),
                vehiculo.trim(),
                compra.getClienteVendedor().getId(),
                cliente.trim(),
                compra.getUsuarioResponsable() == null ? null : compra.getUsuarioResponsable().getId(),
                compra.getUsuarioResponsable() == null ? null : compra.getUsuarioResponsable().getNombre(),
                compra.getFechaCompra(),
                compra.getCostoAdquisicion(),
                compra.getComprobantePath() == null ? null : "/api/compras/" + compra.getId() + "/comprobante",
                compra.getObservaciones()
        );
    }
}
