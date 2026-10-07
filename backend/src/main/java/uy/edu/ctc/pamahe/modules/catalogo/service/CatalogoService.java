package uy.edu.ctc.pamahe.modules.catalogo.service;

import java.math.BigDecimal;
import java.time.Year;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.common.exception.ResourceNotFoundException;
import uy.edu.ctc.pamahe.common.response.PageResponse;
import uy.edu.ctc.pamahe.common.util.MonedaUtils;
import uy.edu.ctc.pamahe.modules.catalogo.dto.response.CatalogoVehiculoResponse;
import uy.edu.ctc.pamahe.modules.imagenes.model.ImagenVehiculo;
import uy.edu.ctc.pamahe.modules.imagenes.repository.ImagenVehiculoRepository;
import uy.edu.ctc.pamahe.modules.parametros.repository.ParametroRepository;
import uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.repository.VehiculoRepository;

/**
 * Construye una proyección pública deliberadamente reducida del inventario.
 * Nunca expone costos, observaciones internas, clientes ni auditoría.
 */
@Service
public class CatalogoService {

        private static final List<EstadoVehiculo> ESTADOS_PUBLICOS = List.of(
                        EstadoVehiculo.DISPONIBLE,
                        EstadoVehiculo.RESERVADO);

        private final VehiculoRepository vehiculoRepository;
        private final ImagenVehiculoRepository imagenVehiculoRepository;
        private final ParametroRepository parametroRepository;

        public CatalogoService(
                        VehiculoRepository vehiculoRepository,
                        ImagenVehiculoRepository imagenVehiculoRepository,
                        ParametroRepository parametroRepository) {
                this.vehiculoRepository = vehiculoRepository;
                this.imagenVehiculoRepository = imagenVehiculoRepository;
                this.parametroRepository = parametroRepository;
        }

        @Transactional(readOnly = true)
        public List<CatalogoVehiculoResponse> listarDisponibles(
                        String marca,
                        String modelo,
                        String tipoVehiculo,
                        Integer anioDesde,
                        Integer anioHasta,
                        BigDecimal precioMin,
                        BigDecimal precioMax) {
                validarFiltros(anioDesde, anioHasta, precioMin, precioMax);
                BigDecimal cotizacion = cotizacionUsdUyu();

                List<Vehiculo> vehiculos = this.vehiculoRepository.buscarCatalogo(
                                ESTADOS_PUBLICOS,
                                normalizarFiltro(marca),
                                normalizarFiltro(modelo),
                                normalizarClave(tipoVehiculo),
                                anioDesde,
                                anioHasta,
                                MonedaUtils.convertirUyuAUsd(precioMin, cotizacion),
                                MonedaUtils.convertirUyuAUsd(precioMax, cotizacion));

                return proyectarLista(vehiculos, cotizacion);
        }

        @Transactional(readOnly = true)
        public PageResponse<CatalogoVehiculoResponse> listarDisponiblesPaginado(
                        String marca,
                        String modelo,
                        String tipoVehiculo,
                        Integer anioDesde,
                        Integer anioHasta,
                        BigDecimal precioMin,
                        BigDecimal precioMax,
                        int page,
                        int size) {
                validarFiltros(anioDesde, anioHasta, precioMin, precioMax);
                validarPaginacion(page, size);
                BigDecimal cotizacion = cotizacionUsdUyu();
                var resultado = this.vehiculoRepository.buscarCatalogoPaginado(
                                ESTADOS_PUBLICOS,
                                normalizarFiltro(marca),
                                normalizarFiltro(modelo),
                                normalizarClave(tipoVehiculo),
                                anioDesde,
                                anioHasta,
                                MonedaUtils.convertirUyuAUsd(precioMin, cotizacion),
                                MonedaUtils.convertirUyuAUsd(precioMax, cotizacion),
                                PageRequest.of(page, size));

                List<CatalogoVehiculoResponse> content = proyectarLista(resultado.getContent(), cotizacion);
                return new PageResponse<>(
                                content,
                                resultado.getNumber(),
                                resultado.getSize(),
                                resultado.getTotalElements(),
                                resultado.getTotalPages(),
                                resultado.isFirst(),
                                resultado.isLast());
        }

        @Transactional(readOnly = true)
        public CatalogoVehiculoResponse obtenerDetalle(Long id) {
                Vehiculo vehiculo = this.vehiculoRepository
                                .findByIdAndActivoTrueAndPublicadoTrueAndEstadoIn(id, ESTADOS_PUBLICOS)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "El vehículo ya no está disponible en el catálogo."));

                List<String> imagenes = this.imagenVehiculoRepository
                                .findByVehiculoAndActivoTrueAndPublicaTrueOrderByPrincipalDescIdAsc(vehiculo)
                                .stream()
                                .map(ImagenVehiculo::getUrlPublica)
                                .filter(Objects::nonNull)
                                .toList();

                BigDecimal cotizacion = cotizacionUsdUyu();
                return toPublicResponse(vehiculo, etiquetaTipoVehiculo(vehiculo.getTipoVehiculo()), imagenes,
                                parametro("WHATSAPP"), parametro("TELEFONO"), cotizacion);
        }

        private List<CatalogoVehiculoResponse> proyectarLista(List<Vehiculo> vehiculos, BigDecimal cotizacion) {
                if (vehiculos.isEmpty()) {
                        return List.of();
                }

                Map<Long, List<String>> imagenesPorVehiculo = this.imagenVehiculoRepository
                                .findByVehiculoInAndActivoTrueAndPublicaTrueOrderByPrincipalDescIdAsc(vehiculos)
                                .stream()
                                .filter(i -> i.getUrlPublica() != null)
                                .collect(Collectors.groupingBy(
                                                i -> i.getVehiculo().getId(),
                                                Collectors.mapping(ImagenVehiculo::getUrlPublica,
                                                                Collectors.toList())));

                String whatsapp = parametro("WHATSAPP");
                String telefono = parametro("TELEFONO");
                Map<String, String> etiquetasTipoVehiculo = etiquetasTipoVehiculo();

                return vehiculos.stream()
                                .map(v -> toPublicResponse(
                                                v,
                                                etiquetaTipoVehiculo(v.getTipoVehiculo(), etiquetasTipoVehiculo),
                                                imagenesPorVehiculo.getOrDefault(v.getId(), List.of()),
                                                whatsapp,
                                                telefono,
                                                cotizacion))
                                .toList();
        }

        private Map<String, String> etiquetasTipoVehiculo() {
                return this.parametroRepository.findByCategoriaOrderByClaveAsc("TIPO_VEHICULO").stream()
                                .collect(Collectors.toMap(
                                                p -> p.getClave().trim().toUpperCase(java.util.Locale.ROOT),
                                                p -> p.getValor() == null || p.getValor().isBlank()
                                                                ? p.getClave()
                                                                : p.getValor().trim(),
                                                (primero, segundo) -> primero));
        }

        private String etiquetaTipoVehiculo(String clave) {
                String normalizada = normalizarClave(clave);
                if (normalizada == null) {
                        return null;
                }
                return this.parametroRepository.findByCategoriaAndClave("TIPO_VEHICULO", normalizada)
                                .map(p -> p.getValor() == null || p.getValor().isBlank()
                                                ? p.getClave()
                                                : p.getValor().trim())
                                .orElse(normalizada);
        }

        private String etiquetaTipoVehiculo(String clave, Map<String, String> etiquetas) {
                String normalizada = normalizarClave(clave);
                return normalizada == null ? null : etiquetas.getOrDefault(normalizada, normalizada);
        }

        private void validarFiltros(Integer anioDesde, Integer anioHasta, BigDecimal precioMin, BigDecimal precioMax) {
                int maximo = Year.now().getValue();
                if ((anioDesde != null && (anioDesde < 1900 || anioDesde > maximo))
                                || (anioHasta != null && (anioHasta < 1900 || anioHasta > maximo))) {
                        throw new BusinessException("Los años de filtro deben estar entre 1900 y " + maximo + ".");
                }
                if (anioDesde != null && anioHasta != null && anioDesde > anioHasta) {
                        throw new BusinessException("El año mínimo no puede ser mayor que el año máximo.");
                }
                if (precioMin != null && precioMax != null && precioMin.compareTo(precioMax) > 0) {
                        throw new BusinessException("El precio mínimo no puede ser mayor que el precio máximo.");
                }
                if (precioMin != null && precioMin.compareTo(BigDecimal.ZERO) < 0) {
                        throw new BusinessException("El precio mínimo no puede ser negativo.");
                }
                if (precioMax != null && precioMax.compareTo(BigDecimal.ZERO) < 0) {
                        throw new BusinessException("El precio máximo no puede ser negativo.");
                }
        }

        private void validarPaginacion(int page, int size) {
        if ((long) page * size > Integer.MAX_VALUE) {
            throw new BusinessException("La página solicitada no es válida.");
        }
                if (page < 0) {
                        throw new BusinessException("La página solicitada no es válida.");
                }
                if (size < 1 || size > 100) {
                        throw new BusinessException("No pudimos mostrar esa página. Actualizá la vista e intentá nuevamente.");
                }
        }

        private String parametro(String clave) {
                return this.parametroRepository.findByCategoriaAndClaveAndActivoTrue("CONTACTO", clave)
                                .map(p -> p.getValor())
                                .filter(Objects::nonNull)
                                .orElse(null);
        }

        private String normalizarFiltro(String valor) {
                if (valor == null) {
                        return null;
                }
                String limpio = valor.trim();
                return limpio.isEmpty() ? null : limpio;
        }

        private String normalizarClave(String valor) {
                String limpio = normalizarFiltro(valor);
                return limpio == null ? null : limpio.toUpperCase(java.util.Locale.ROOT);
        }

        private BigDecimal cotizacionUsdUyu() {
                return this.parametroRepository
                                .findByCategoriaAndClaveAndActivoTrue(
                                                MonedaUtils.CATEGORIA_MONEDA,
                                                MonedaUtils.CLAVE_USD_UYU)
                                .map(parametro -> MonedaUtils.parsearCotizacionUsdUyu(parametro.getValor()))
                                .orElse(MonedaUtils.COTIZACION_USD_UYU_PREDETERMINADA);
        }

        private CatalogoVehiculoResponse toPublicResponse(Vehiculo vehiculo,
                        String tipoVehiculoLabel,
                        List<String> imagenes,
                        String whatsapp,
                        String telefono,
                        BigDecimal cotizacion) {
                BigDecimal precioUsd = vehiculo.getPrecioVentaUsd();
                if ((precioUsd == null || precioUsd.compareTo(BigDecimal.ZERO) <= 0)
                                && vehiculo.getPrecioVentaEstimado() != null
                                && vehiculo.getPrecioVentaEstimado().compareTo(BigDecimal.ZERO) > 0) {
                        precioUsd = MonedaUtils.convertirUyuAUsd(vehiculo.getPrecioVentaEstimado(), cotizacion);
                }

                BigDecimal precioUyu = precioUsd == null
                                ? vehiculo.getPrecioVentaEstimado()
                                : MonedaUtils.convertirUsdAUyu(precioUsd, cotizacion);

                return new CatalogoVehiculoResponse(
                                vehiculo.getId(),
                                vehiculo.getMarca(),
                                vehiculo.getModelo(),
                                vehiculo.getTipoVehiculo(),
                                tipoVehiculoLabel,
                                vehiculo.getAnio(),
                                vehiculo.getEstado(),
                                vehiculo.getColor(),
                                vehiculo.getKilometraje(),
                                precioUsd,
                                precioUyu,
                                vehiculo.getDescripcionPublica(),
                                imagenes,
                                whatsapp,
                                telefono);
        }
}