package uy.edu.ctc.pamahe.modules.catalogo.service;

import java.math.BigDecimal;
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

                List<Vehiculo> vehiculos = this.vehiculoRepository.buscarCatalogo(
                                EstadoVehiculo.DISPONIBLE,
                                normalizarFiltro(marca),
                                normalizarFiltro(modelo),
                                normalizarClave(tipoVehiculo),
                                anioDesde,
                                anioHasta,
                                precioMin,
                                precioMax);

                return proyectarLista(vehiculos);
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
                var resultado = this.vehiculoRepository.buscarCatalogoPaginado(
                                EstadoVehiculo.DISPONIBLE,
                                normalizarFiltro(marca),
                                normalizarFiltro(modelo),
                                normalizarClave(tipoVehiculo),
                                anioDesde,
                                anioHasta,
                                precioMin,
                                precioMax,
                                PageRequest.of(page, size));

                List<CatalogoVehiculoResponse> content = proyectarLista(resultado.getContent());
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
                                .findByIdAndActivoTrueAndPublicadoTrueAndEstado(id, EstadoVehiculo.DISPONIBLE)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "No se encontró un vehículo público disponible con el identificador solicitado."));

                List<String> imagenes = this.imagenVehiculoRepository
                                .findByVehiculoAndActivoTrueAndPublicaTrueOrderByPrincipalDescIdAsc(vehiculo)
                                .stream()
                                .map(ImagenVehiculo::getUrlPublica)
                                .filter(Objects::nonNull)
                                .toList();

                return toPublicResponse(vehiculo, imagenes, parametro("WHATSAPP"), parametro("TELEFONO"));
        }

        private List<CatalogoVehiculoResponse> proyectarLista(List<Vehiculo> vehiculos) {
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

                return vehiculos.stream()
                                .map(v -> toPublicResponse(
                                                v,
                                                imagenesPorVehiculo.getOrDefault(v.getId(), List.of()),
                                                whatsapp,
                                                telefono))
                                .toList();
        }

        private void validarFiltros(Integer anioDesde, Integer anioHasta, BigDecimal precioMin, BigDecimal precioMax) {
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
                if (page < 0) {
                        throw new BusinessException("La página no puede ser negativa.");
                }
                if (size < 1 || size > 100) {
                        throw new BusinessException("El tamaño de página debe estar entre 1 y 100.");
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

        private CatalogoVehiculoResponse toPublicResponse(Vehiculo vehiculo,
                        List<String> imagenes,
                        String whatsapp,
                        String telefono) {
                return new CatalogoVehiculoResponse(
                        vehiculo.getId(),
                        vehiculo.getMarca(),
                        vehiculo.getModelo(),
                        vehiculo.getTipoVehiculo(),
                        vehiculo.getAnio(),
                        vehiculo.getColor(),
                        vehiculo.getKilometraje(),
                        vehiculo.getPrecioVentaEstimado(),
                        vehiculo.getDescripcionPublica(),
                        imagenes,
                        whatsapp,
                        telefono);
        }
}