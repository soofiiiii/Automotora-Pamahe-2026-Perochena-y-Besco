package uy.edu.ctc.pamahe.modules.catalogo.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.modules.catalogo.dto.response.CatalogoVehiculoResponse;
import uy.edu.ctc.pamahe.modules.imagenes.model.ImagenVehiculo;
import uy.edu.ctc.pamahe.modules.imagenes.repository.ImagenVehiculoRepository;
import uy.edu.ctc.pamahe.modules.parametros.repository.ParametroRepository;
import uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.repository.VehiculoRepository;

/**
 * Construye una proyección pública deliberadamente reducida del inventario.
 *
 * La respuesta se arma desde campos comerciales e imágenes públicas para que
 * costos, observaciones internas, clientes y datos de auditoría nunca formen
 * parte del contrato del catálogo.
 */
@Service
public class CatalogoService {

    private final VehiculoRepository vehiculoRepository;
    private final ImagenVehiculoRepository imagenVehiculoRepository;
    private final ParametroRepository parametroRepository;

    public CatalogoService(
            VehiculoRepository vehiculoRepository,
            ImagenVehiculoRepository imagenVehiculoRepository,
            ParametroRepository parametroRepository
    ) {
        this.vehiculoRepository = vehiculoRepository;
        this.imagenVehiculoRepository = imagenVehiculoRepository;
        this.parametroRepository = parametroRepository;
    }

    @Transactional(readOnly = true)
    public List<CatalogoVehiculoResponse> listarDisponibles(
            String marca,
            String modelo,
            Integer anioDesde,
            Integer anioHasta,
            BigDecimal precioMin,
            BigDecimal precioMax
    ) {

        validarFiltros(
                anioDesde,
                anioHasta,
                precioMin,
                precioMax
        );

        String marcaNormalizada = normalizarFiltro(marca);
        String modeloNormalizado = normalizarFiltro(modelo);

        return this.vehiculoRepository
                .buscarCatalogo(
                        EstadoVehiculo.DISPONIBLE,
                        marcaNormalizada,
                        modeloNormalizado,
                        anioDesde,
                        anioHasta,
                        precioMin,
                        precioMax
                )
                .stream()
                .map(this::toPublicResponse)
                .toList();
    }

    private void validarFiltros(
            Integer anioDesde,
            Integer anioHasta,
            BigDecimal precioMin,
            BigDecimal precioMax
    ) {

        if (anioDesde != null
                && anioHasta != null
                && anioDesde > anioHasta) {

            throw new BusinessException(
                    "El año mínimo no puede ser mayor que el año máximo."
            );
        }

        if (precioMin != null
                && precioMax != null
                && precioMin.compareTo(precioMax) > 0) {

            throw new BusinessException(
                    "El precio mínimo no puede ser mayor que el precio máximo."
            );
        }

        if (precioMin != null
                && precioMin.compareTo(BigDecimal.ZERO) < 0) {

            throw new BusinessException(
                    "El precio mínimo no puede ser negativo."
            );
        }

        if (precioMax != null
                && precioMax.compareTo(BigDecimal.ZERO) < 0) {

            throw new BusinessException(
                    "El precio máximo no puede ser negativo."
            );
        }
    }

    private String normalizarFiltro(String valor) {

        if (valor == null) {
            return null;
        }

        String limpio = valor.trim();

        return limpio.isEmpty() ? null : limpio;
    }

    private CatalogoVehiculoResponse toPublicResponse(
            Vehiculo vehiculo
    ) {

        List<String> imagenes = this.imagenVehiculoRepository
                .findByVehiculoAndActivoTrueAndPublicaTrueOrderByPrincipalDescIdAsc(
                        vehiculo
                )
                .stream()
                .map(ImagenVehiculo::getUrlPublica)
                .filter(Objects::nonNull)
                .toList();

        String whatsapp = this.parametroRepository
                .findByCategoriaAndClaveAndActivoTrue(
                        "CONTACTO",
                        "WHATSAPP"
                )
                .map(p -> p.getValor())
                .orElse(null);

        String telefono = this.parametroRepository
                .findByCategoriaAndClaveAndActivoTrue(
                        "CONTACTO",
                        "TELEFONO"
                )
                .map(p -> p.getValor())
                .orElse(null);

        return new CatalogoVehiculoResponse(
                vehiculo.getId(),
                vehiculo.getMarca(),
                vehiculo.getModelo(),
                vehiculo.getAnio(),
                vehiculo.getColor(),
                vehiculo.getKilometraje(),
                vehiculo.getPrecioVentaEstimado(),
                vehiculo.getDescripcionPublica(),
                imagenes,
                whatsapp,
                telefono
        );
    }
}