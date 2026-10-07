package uy.edu.ctc.pamahe.modules.catalogo.dto.response;

import java.math.BigDecimal;
import java.util.List;

import uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo;

public record CatalogoVehiculoResponse(
        Long id,
        String marca,
        String modelo,
        String tipoVehiculo,
        String tipoVehiculoLabel,
        Integer anio,
        EstadoVehiculo estado,
        String color,
        Integer kilometraje,
        BigDecimal precioVentaUsd,
        BigDecimal precioVentaEstimado,
        String descripcionPublica,
        List<String> imagenes,
        String contactoWhatsapp,
        String contactoTelefono
) {
}
