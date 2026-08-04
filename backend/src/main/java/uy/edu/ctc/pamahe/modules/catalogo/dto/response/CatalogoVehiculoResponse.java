package uy.edu.ctc.pamahe.modules.catalogo.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record CatalogoVehiculoResponse(
        Long id,
        String marca,
        String modelo,
        Integer anio,
        String color,
        Integer kilometraje,
        BigDecimal precioVentaEstimado,
        String descripcionPublica,
        List<String> imagenes,
        String contactoWhatsapp,
        String contactoTelefono
) {
}
