package uy.edu.ctc.pamahe.modules.ventas.mapper;

import uy.edu.ctc.pamahe.modules.ventas.dto.response.VentaDetalleGerencialResponse;
import uy.edu.ctc.pamahe.modules.ventas.dto.response.VentaResponse;
import uy.edu.ctc.pamahe.modules.ventas.model.Venta;

public final class VentaMapper {
    private VentaMapper() {}


    public static VentaResponse toResponse(Venta venta) {
        return new VentaResponse(
                venta.getId(),
                venta.getVehiculo().getId(),
                nombreVehiculo(venta),
                venta.getClienteComprador().getId(),
                nombreCliente(venta),
                venta.getVendedor().getId(),
                venta.getVendedor().getNombre(),
                venta.getFechaVenta(),
                venta.getPrecioFinal(),
                comprobanteUrl(venta),
                venta.getObservaciones()
        );
    }

    public static VentaDetalleGerencialResponse toDetalleGerencial(Venta venta) {
        return new VentaDetalleGerencialResponse(
                venta.getId(),
                venta.getVehiculo().getId(),
                nombreVehiculo(venta),
                venta.getClienteComprador().getId(),
                nombreCliente(venta),
                venta.getVendedor().getId(),
                venta.getVendedor().getNombre(),
                venta.getFechaVenta(),
                venta.getCostoCompraAlVender(),
                venta.getCostoRefaccionesAlVender(),
                venta.getCostoTotalAlVender(),
                venta.getPrecioFinal(),
                venta.getRentabilidadCalculada(),
                comprobanteUrl(venta),
                venta.getObservaciones()
        );
    }

    private static String nombreVehiculo(Venta venta) {
        return (venta.getVehiculo().getMarca() + " "
                + venta.getVehiculo().getModelo() + " "
                + venta.getVehiculo().getAnio()).trim();
    }

    private static String nombreCliente(Venta venta) {
        return (venta.getClienteComprador().getNombre() + " "
                + (venta.getClienteComprador().getApellido() == null ? "" : venta.getClienteComprador().getApellido())).trim();
    }

    private static String comprobanteUrl(Venta venta) {
        return venta.getComprobantePath() == null ? null : "/api/ventas/" + venta.getId() + "/comprobante";
    }
}

