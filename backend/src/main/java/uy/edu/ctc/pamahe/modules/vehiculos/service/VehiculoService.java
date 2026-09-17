package uy.edu.ctc.pamahe.modules.vehiculos.service;

import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.common.exception.ResourceNotFoundException;
import uy.edu.ctc.pamahe.common.response.PageResponse;
import uy.edu.ctc.pamahe.common.util.SecurityUtils;
import uy.edu.ctc.pamahe.modules.auditoria.service.AuditoriaService;
import uy.edu.ctc.pamahe.modules.compras.mapper.CompraMapper;
import uy.edu.ctc.pamahe.modules.compras.repository.CompraRepository;
import uy.edu.ctc.pamahe.modules.imagenes.mapper.ImagenVehiculoMapper;
import uy.edu.ctc.pamahe.modules.imagenes.repository.ImagenVehiculoRepository;
import uy.edu.ctc.pamahe.modules.parametros.repository.ParametroRepository;
import uy.edu.ctc.pamahe.modules.taller.mapper.RefaccionMapper;
import uy.edu.ctc.pamahe.modules.taller.model.EstadoTarea;
import uy.edu.ctc.pamahe.modules.taller.repository.RefaccionRepository;
import uy.edu.ctc.pamahe.modules.vehiculos.dto.request.CambiarEstadoVehiculoRequest;
import uy.edu.ctc.pamahe.modules.vehiculos.dto.request.CambiarPublicacionVehiculoRequest;
import uy.edu.ctc.pamahe.modules.vehiculos.dto.request.VehiculoRequest;
import uy.edu.ctc.pamahe.modules.vehiculos.dto.response.historial.CompraHistorialComercialResponse;
import uy.edu.ctc.pamahe.modules.vehiculos.dto.response.historial.RefaccionHistorialComercialResponse;
import uy.edu.ctc.pamahe.modules.vehiculos.dto.response.historial.VehiculoHistorialComercialResponse;
import uy.edu.ctc.pamahe.modules.vehiculos.dto.response.historial.VehiculoHistorialGerencialResponse;
import uy.edu.ctc.pamahe.modules.vehiculos.dto.response.historial.VehiculoHistorialTallerResponse;
import uy.edu.ctc.pamahe.modules.vehiculos.repository.VehiculoRepository;
import uy.edu.ctc.pamahe.modules.ventas.mapper.VentaMapper;
import uy.edu.ctc.pamahe.modules.ventas.repository.VentaRepository;
import uy.edu.ctc.pamahe.modules.vehiculos.mapper.VehiculoMapper;
import uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;

import java.math.BigDecimal;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;

/**
 * Administra la entidad central del dominio y protege su ciclo de vida mediante una máquina de estados.
 * Las transiciones se validan en backend para mantener sincronizados inventario, taller, catálogo y ventas
 * incluso cuando una solicitud no proviene de la interfaz prevista.
 */
@Service
public class VehiculoService {

    // La tabla explícita documenta las rutas válidas y evita estados alcanzados por asignaciones aisladas.
    private static final Map<EstadoVehiculo, EnumSet<EstadoVehiculo>> TRANSICIONES = Map.of(
        EstadoVehiculo.COMPRADO, EnumSet.of(EstadoVehiculo.EN_TALLER, EstadoVehiculo.DISPONIBLE, EstadoVehiculo.DADO_DE_BAJA),
        EstadoVehiculo.EN_TALLER, EnumSet.of(EstadoVehiculo.DISPONIBLE, EstadoVehiculo.DADO_DE_BAJA),
        EstadoVehiculo.DISPONIBLE, EnumSet.of(EstadoVehiculo.RESERVADO, EstadoVehiculo.EN_TALLER, EstadoVehiculo.VENDIDO, EstadoVehiculo.DADO_DE_BAJA),
        EstadoVehiculo.RESERVADO, EnumSet.of(EstadoVehiculo.DISPONIBLE, EstadoVehiculo.VENDIDO),
        EstadoVehiculo.VENDIDO, EnumSet.noneOf(EstadoVehiculo.class),
        EstadoVehiculo.DADO_DE_BAJA, EnumSet.noneOf(EstadoVehiculo.class)
    );

    private final VehiculoRepository vehiculoRepository;
    private final CompraRepository compraRepository;
    private final RefaccionRepository refaccionRepository;
    private final AuditoriaService auditoriaService;
    private final VentaRepository ventaRepository;
    private final ImagenVehiculoRepository imagenVehiculoRepository;
    private final ParametroRepository parametroRepository;

    public VehiculoService(VehiculoRepository vehiculoRepository,
                           CompraRepository compraRepository,
                           RefaccionRepository refaccionRepository,
                           AuditoriaService auditoriaService,
                           VentaRepository ventaRepository,
                           ImagenVehiculoRepository imagenVehiculoRepository,
                           ParametroRepository parametroRepository) {
        this.vehiculoRepository = vehiculoRepository;
        this.compraRepository = compraRepository;
        this.refaccionRepository = refaccionRepository;
        this.auditoriaService = auditoriaService;
        this.ventaRepository = ventaRepository;
        this.imagenVehiculoRepository = imagenVehiculoRepository;
        this.parametroRepository = parametroRepository;
    }

    @Transactional(readOnly = true)
    public List<?> listar(
            EstadoVehiculo estado,
            String marca,
            String modelo,
            String tipoVehiculo,
            Integer anioDesde,
            Integer anioHasta,
            BigDecimal precioMin,
            BigDecimal precioMax,
            Boolean publicado,
            Boolean disponibleComercial) {
        validarFiltrosStock(anioDesde, anioHasta, precioMin, precioMax);

        List<Vehiculo> vehiculos = this.vehiculoRepository.buscarConFiltros(
                estado, normalizarFiltro(marca), normalizarFiltro(modelo), normalizarClave(tipoVehiculo),
                anioDesde, anioHasta, precioMin, precioMax, publicado, disponibleComercial);
        return proyectarListaSegunRol(vehiculos);
    }

    @Transactional(readOnly = true)
    public PageResponse<?> listarPaginado(
            EstadoVehiculo estado,
            String marca,
            String modelo,
            String tipoVehiculo,
            Integer anioDesde,
            Integer anioHasta,
            BigDecimal precioMin,
            BigDecimal precioMax,
            Boolean publicado,
            Boolean disponibleComercial,
            int page,
            int size) {
        validarFiltrosStock(anioDesde, anioHasta, precioMin, precioMax);
        validarPaginacion(page, size);
        var resultado = this.vehiculoRepository.buscarConFiltrosPaginado(
                estado, normalizarFiltro(marca), normalizarFiltro(modelo), normalizarClave(tipoVehiculo),
                anioDesde, anioHasta, precioMin, precioMax, publicado, disponibleComercial,
                PageRequest.of(page, size));

        if (SecurityUtils.tieneAlgunRol("ADMINISTRADOR", "DUENO")) {
            return PageResponse.from(resultado, VehiculoMapper::toResponse);
        }
        if (SecurityUtils.tieneAlgunRol("VENDEDOR")) {
            return PageResponse.from(resultado, VehiculoMapper::toComercialResponse);
        }
        if (SecurityUtils.tieneAlgunRol("TALLER")) {
            return PageResponse.from(resultado, VehiculoMapper::toTallerResponse);
        }
        throw new AccessDeniedException("El rol autenticado no puede consultar vehículos.");
    }

    @Transactional(readOnly = true)
    public Object obtener(Long id) {
        Vehiculo vehiculo = this.buscarActivoPorId(id);

        if (SecurityUtils.tieneAlgunRol("ADMINISTRADOR", "DUENO")) {
            return VehiculoMapper.toResponse(vehiculo);
        }

        if (SecurityUtils.tieneAlgunRol("VENDEDOR")) {
            return VehiculoMapper.toComercialResponse(vehiculo);
        }

        if (SecurityUtils.tieneAlgunRol("TALLER")) {
            return VehiculoMapper.toTallerResponse(vehiculo);
        }

        throw new AccessDeniedException(
                "El rol autenticado no puede consultar vehículos."
        );
    }

    @Transactional
    public Object crear(VehiculoRequest request) {
        Vehiculo vehiculo = new Vehiculo();
        vehiculo.setEstado(EstadoVehiculo.COMPRADO);
        vehiculo.setPublicado(false);
        this.cargarDatosEditables(vehiculo, request);
        Vehiculo guardado = this.vehiculoRepository.save(vehiculo);
        this.auditoriaService.registrar(
                "ALTA",
                "Vehiculo",
                guardado.getId(),
                "Creación de vehículo",
                null,
                this.resumenVehiculo(guardado)
        );
        return this.proyectarSegunRol(guardado);
    }

    @Transactional
    public Object actualizar(Long id, VehiculoRequest request) {
        Vehiculo vehiculo = this.buscarActivoPorIdConBloqueo(id);
        String anterior = this.resumenVehiculo(vehiculo);
        this.cargarDatosEditables(vehiculo, request);
        Vehiculo guardado = this.vehiculoRepository.save(vehiculo);
        this.auditoriaService.registrar(
                "MODIFICACION",
                "Vehiculo",
                guardado.getId(),
                "Actualización de datos técnicos y comerciales del vehículo",
                anterior,
                this.resumenVehiculo(guardado)
        );
        return this.proyectarSegunRol(guardado);
    }

    @Transactional
    public Object cambiarEstado(Long id, CambiarEstadoVehiculoRequest request) {
        // VENDIDO necesita una venta persistida; permitirlo manualmente rompería el cierre económico.
        if (request.estado() == EstadoVehiculo.VENDIDO) {
            throw new BusinessException("El estado VENDIDO se asigna exclusivamente al registrar una venta válida.");
        }
        Vehiculo vehiculo = this.buscarActivoPorIdConBloqueo(id);
        this.validarPermisoTransicionManual(vehiculo.getEstado(), request.estado());
        this.aplicarTransicion(vehiculo, request.estado(), request.motivo(), false);
        return this.proyectarSegunRol(vehiculo);
    }

     @Transactional
    public Object cambiarPublicacion(Long id, CambiarPublicacionVehiculoRequest request) {
        Vehiculo vehiculo = this.buscarActivoPorIdConBloqueo(id);
        boolean anterior = Boolean.TRUE.equals(vehiculo.getPublicado());
        // La publicación es una consecuencia comercial del estado, no un estado paralelo independiente.
        if (Boolean.TRUE.equals(request.publicado()) && vehiculo.getEstado() != EstadoVehiculo.DISPONIBLE) {
            throw new BusinessException("Solo se pueden publicar vehículos en estado DISPONIBLE.");
        }
        if (Boolean.TRUE.equals(request.publicado())
                && (vehiculo.getPrecioVentaEstimado() == null
                || vehiculo.getPrecioVentaEstimado().compareTo(BigDecimal.ZERO) <= 0)) {
            throw new BusinessException("Para publicar un vehículo debe existir un precio de venta estimado mayor que cero.");
        }
        vehiculo.setPublicado(request.publicado());
        this.vehiculoRepository.save(vehiculo);
        this.auditoriaService.registrar(
                "CAMBIO_PUBLICACION",
                "Vehiculo",
                vehiculo.getId(),
                request.publicado() ? "Vehículo habilitado para el catálogo" : "Vehículo retirado del catálogo",
                "publicado=" + anterior,
                "publicado=" + request.publicado()
        );
        return this.proyectarSegunRol(vehiculo);
    }

    @Transactional
    public void cambiarEstadoPorSistema(Vehiculo vehiculo, EstadoVehiculo destino, String motivo) {
        this.aplicarTransicion(vehiculo, destino, motivo, true);
    }

    @Transactional
    public void marcarVendidoPorVenta(Vehiculo vehiculo, Long ventaId) {
        if (vehiculo.getEstado() != EstadoVehiculo.DISPONIBLE && vehiculo.getEstado() != EstadoVehiculo.RESERVADO) {
            throw new BusinessException("Solo un vehículo DISPONIBLE o RESERVADO puede cerrarse como vendido.");
        }
        this.aplicarTransicion(vehiculo, EstadoVehiculo.VENDIDO, "Venta registrada: " + ventaId, true);
    }

    @Transactional
    public void desactivar(Long id) {
        Vehiculo vehiculo = this.buscarActivoPorIdConBloqueo(id);
        if (vehiculo.getEstado() == EstadoVehiculo.VENDIDO
                || this.compraRepository.existsByVehiculo(vehiculo)
                || this.refaccionRepository.existsByVehiculo(vehiculo)
                || this.ventaRepository.existsByVehiculo(vehiculo)) {
            throw new BusinessException("No se puede desactivar un vehículo que forma parte del historial de operaciones. Utilizá DADO_DE_BAJA cuando corresponda comercialmente.");
        }
        String anterior = this.resumenVehiculo(vehiculo);
        vehiculo.setActivo(false);
        vehiculo.setPublicado(false);
        this.vehiculoRepository.save(vehiculo);
        this.auditoriaService.registrar(
                "BAJA_LOGICA",
                "Vehiculo",
                vehiculo.getId(),
                "Desactivación de vehículo",
                anterior,
                "activo=false, publicado=false"
        );
    }

    @Transactional(readOnly = true)
    public Object historial(Long id) {
        Vehiculo vehiculo = this.buscarPorId(id);
        var compra = this.compraRepository.findByVehiculoAndActivoTrue(vehiculo).orElse(null);
        var refacciones = this.refaccionRepository.findByVehiculoAndActivoTrueOrderByFechaDesc(vehiculo);
        var venta = this.ventaRepository.findByVehiculoAndActivoTrue(vehiculo).orElse(null);
        var imagenes = this.imagenVehiculoRepository.findByVehiculoAndActivoTrueOrderByPrincipalDescIdAsc(vehiculo)
                .stream().map(ImagenVehiculoMapper::toResponse).toList();

        if (SecurityUtils.tieneAlgunRol("ADMINISTRADOR", "DUENO")) {
            return new VehiculoHistorialGerencialResponse(
                    VehiculoMapper.toResponse(vehiculo),
                    compra == null ? null : CompraMapper.toResponse(compra),
                    refacciones.stream().map(RefaccionMapper::toResponse).toList(),
                    venta == null ? null : VentaMapper.toDetalleGerencial(venta),
                    imagenes
            );
        }

        if (SecurityUtils.tieneAlgunRol("VENDEDOR")) {
            CompraHistorialComercialResponse compraResumen = null;
            if (compra != null) {
                String cliente = (compra.getClienteVendedor().getNombre() + " "
                        + (compra.getClienteVendedor().getApellido() == null ? "" : compra.getClienteVendedor().getApellido())).trim();
                compraResumen = new CompraHistorialComercialResponse(
                        compra.getId(), compra.getClienteVendedor().getId(), cliente, compra.getFechaCompra());
            }
            return new VehiculoHistorialComercialResponse(
                    VehiculoMapper.toComercialResponse(vehiculo),
                    compraResumen,
                    refacciones.stream().map(r -> new RefaccionHistorialComercialResponse(
                            r.getId(), r.getFecha(), r.getTipoTrabajo(), r.getDescripcion(), r.getEstadoTarea())).toList(),
                    venta == null ? null : VentaMapper.toResponse(venta),
                    imagenes
            );
        }

        if (SecurityUtils.tieneAlgunRol("TALLER")) {
            return new VehiculoHistorialTallerResponse(
                    VehiculoMapper.toTallerResponse(vehiculo),
                    compra == null ? null : compra.getFechaCompra(),
                    refacciones.stream().map(RefaccionMapper::toResponse).toList(),
                    venta == null ? null : venta.getFechaVenta(),
                    imagenes
            );
        }

         throw new AccessDeniedException("El rol autenticado no puede consultar el historial del vehículo.");
    }



    @Transactional(readOnly = true)
    public Vehiculo buscarPorId(Long id) {
        return this.vehiculoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el vehículo solicitado."));
    }

    @Transactional(readOnly = true)
    public Vehiculo buscarActivoPorId(Long id) {
        Vehiculo vehiculo = this.buscarPorId(id);
        if (!Boolean.TRUE.equals(vehiculo.getActivo())) {
            throw new ResourceNotFoundException("No se encontró un vehículo activo con el identificador solicitado.");
        }
        return vehiculo;
    }

    @Transactional
    /** Bloquea la fila durante operaciones que podrían competir por el mismo vehículo. */
    public Vehiculo buscarActivoPorIdConBloqueo(Long id) {
        Vehiculo vehiculo = this.vehiculoRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el vehículo solicitado."));
        if (!Boolean.TRUE.equals(vehiculo.getActivo())) {
            throw new ResourceNotFoundException("No se encontró un vehículo activo con el identificador solicitado.");
        }
        return vehiculo;
    }

    /** Restringe las transiciones manuales según la responsabilidad operativa de cada rol. */
    private void validarPermisoTransicionManual(EstadoVehiculo origen, EstadoVehiculo destino) {
        if (SecurityUtils.tieneAlgunRol("ADMINISTRADOR", "DUENO")) {
            return;
        }

        boolean permitidoVendedor = SecurityUtils.tieneAlgunRol("VENDEDOR") && (
                (origen == EstadoVehiculo.COMPRADO && destino == EstadoVehiculo.DISPONIBLE)
                        || (origen == EstadoVehiculo.DISPONIBLE && destino == EstadoVehiculo.RESERVADO)
                        || (origen == EstadoVehiculo.RESERVADO && destino == EstadoVehiculo.DISPONIBLE)
                        || (origen == EstadoVehiculo.DISPONIBLE && destino == EstadoVehiculo.EN_TALLER)
        );
        boolean permitidoTaller = SecurityUtils.tieneAlgunRol("TALLER") && (
                (origen == EstadoVehiculo.COMPRADO && destino == EstadoVehiculo.EN_TALLER)
                        || (origen == EstadoVehiculo.DISPONIBLE && destino == EstadoVehiculo.EN_TALLER)
                        || (origen == EstadoVehiculo.EN_TALLER && destino == EstadoVehiculo.DISPONIBLE)
        );

        if (!permitidoVendedor && !permitidoTaller) {
            throw new AccessDeniedException("El rol autenticado no puede realizar esta transición de estado.");
        }
    }

    private void aplicarTransicion(Vehiculo vehiculo,
                                   EstadoVehiculo destino,
                                   String motivo,
                                   boolean operacionInterna) {
        EstadoVehiculo origen = vehiculo.getEstado();
        if (origen == destino) {
            throw new BusinessException("El vehículo ya se encuentra en el estado " + destino + ".");
        }
        if (!TRANSICIONES.getOrDefault(origen, EnumSet.noneOf(EstadoVehiculo.class)).contains(destino)) {
            throw new BusinessException("La transición " + origen + " → " + destino + " no está permitida.");
        }
        if (destino == EstadoVehiculo.VENDIDO && !operacionInterna) {
            throw new BusinessException("El estado VENDIDO solo puede asignarse desde el registro de venta.");
        }
        // Avanzar sin compra impediría calcular el costo y reconstruir el origen de la unidad.
        if (origen == EstadoVehiculo.COMPRADO
                && destino != EstadoVehiculo.DADO_DE_BAJA
                && !this.compraRepository.existsByVehiculoAndActivoTrue(vehiculo)) {
            throw new BusinessException("El vehículo debe tener una compra activa antes de avanzar en su ciclo operativo.");
        }
        // DISPONIBLE implica que no quedan trabajos abiertos capaces de afectar costo o preparación.
        if (origen == EstadoVehiculo.EN_TALLER && destino == EstadoVehiculo.DISPONIBLE
                && this.refaccionRepository.existsByVehiculoAndActivoTrueAndEstadoTareaIn(
                vehiculo,
                List.of(EstadoTarea.PENDIENTE, EstadoTarea.EN_CURSO))) {
            throw new BusinessException("No se puede marcar el vehículo como DISPONIBLE mientras existan tareas pendientes o en curso.");
        }

        vehiculo.setEstado(destino);
        // Fuera de DISPONIBLE se retira del catálogo para evitar ofrecer una unidad no comercializable.
        if (destino != EstadoVehiculo.DISPONIBLE) {
            vehiculo.setPublicado(false);
        }
        this.vehiculoRepository.save(vehiculo);
        this.auditoriaService.registrar(
                "CAMBIO_ESTADO",
                "Vehiculo",
                vehiculo.getId(),
                motivo == null || motivo.isBlank() ? "Cambio controlado de estado" : motivo.trim(),
                "estado=" + origen,
                "estado=" + destino + ", publicado=" + vehiculo.getPublicado()
        );
    }

    private void cargarDatosEditables(Vehiculo vehiculo, VehiculoRequest request) {
        vehiculo.setMarca(request.marca().trim());
        vehiculo.setModelo(request.modelo().trim());
        vehiculo.setTipoVehiculo(validarTipoVehiculo(request.tipoVehiculo()));
        vehiculo.setAnio(request.anio());
        vehiculo.setMatricula(this.normalizarOpcional(request.matricula()));
        vehiculo.setNumeroChasis(this.normalizarOpcional(request.numeroChasis()));
        vehiculo.setColor(this.normalizarOpcional(request.color()));
        vehiculo.setKilometraje(request.kilometraje());
        vehiculo.setPrecioVentaEstimado(request.precioVentaEstimado() == null ? BigDecimal.ZERO : request.precioVentaEstimado());
        vehiculo.setDescripcionPublica(this.normalizarOpcional(request.descripcionPublica()));

        String observacionesSolicitadas = this.normalizarOpcional(request.observacionesInternas());
        if (SecurityUtils.tieneAlgunRol("ADMINISTRADOR", "DUENO")) {
            vehiculo.setObservacionesInternas(observacionesSolicitadas);
        } else if (observacionesSolicitadas != null) {
            throw new AccessDeniedException("Solo ADMINISTRADOR o DUENO pueden modificar observaciones internas del vehículo.");
        }
    }

    private Object proyectarSegunRol(Vehiculo vehiculo) {
        if (SecurityUtils.tieneAlgunRol("ADMINISTRADOR", "DUENO")) {
            return VehiculoMapper.toResponse(vehiculo);
        }
        if (SecurityUtils.tieneAlgunRol("VENDEDOR")) {
            return VehiculoMapper.toComercialResponse(vehiculo);
        }
        if (SecurityUtils.tieneAlgunRol("TALLER")) {
            return VehiculoMapper.toTallerResponse(vehiculo);
        }
        throw new AccessDeniedException("El rol autenticado no puede recibir información del vehículo.");
    }

    private String normalizarOpcional(String valor) {
        if (valor == null) {
            return null;
        }
        String limpio = valor.trim();
        return limpio.isEmpty() ? null : limpio;
    }

    private List<?> proyectarListaSegunRol(List<Vehiculo> vehiculos) {
        if (SecurityUtils.tieneAlgunRol("ADMINISTRADOR", "DUENO")) {
            return vehiculos.stream().map(VehiculoMapper::toResponse).toList();
        }
        if (SecurityUtils.tieneAlgunRol("VENDEDOR")) {
            return vehiculos.stream().map(VehiculoMapper::toComercialResponse).toList();
        }
        if (SecurityUtils.tieneAlgunRol("TALLER")) {
            return vehiculos.stream().map(VehiculoMapper::toTallerResponse).toList();
        }
        throw new AccessDeniedException("El rol autenticado no puede consultar vehículos.");
    }

    private void validarFiltrosStock(Integer anioDesde, Integer anioHasta, BigDecimal precioMin, BigDecimal precioMax) {
        if (anioDesde != null && anioHasta != null && anioDesde > anioHasta) {
            throw new BusinessException("El año desde no puede ser mayor que el año hasta.");
        }
        if (precioMin != null && precioMin.compareTo(BigDecimal.ZERO) < 0
                || precioMax != null && precioMax.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("Los filtros de precio no pueden ser negativos.");
        }
        if (precioMin != null && precioMax != null && precioMin.compareTo(precioMax) > 0) {
            throw new BusinessException("El precio mínimo no puede ser mayor que el precio máximo.");
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

    private String validarTipoVehiculo(String tipoVehiculo) {
        String clave = normalizarClave(tipoVehiculo);
        if (clave == null) {
            return null;
        }
        if (this.parametroRepository.findByCategoriaAndClaveAndActivoTrue("TIPO_VEHICULO", clave).isEmpty()) {
            throw new BusinessException("El tipo de vehículo indicado no está habilitado en parámetros.");
        }
        return clave;
    }

    private String normalizarClave(String valor) {
        String limpio = normalizarFiltro(valor);
        return limpio == null ? null : limpio.toUpperCase(java.util.Locale.ROOT);
    }

    private String resumenVehiculo(Vehiculo vehiculo) {
        return "marca=" + vehiculo.getMarca()
                + ", modelo=" + vehiculo.getModelo()
                + ", anio=" + vehiculo.getAnio()
                + ", kilometraje=" + vehiculo.getKilometraje()
                + ", precioVentaEstimado=" + vehiculo.getPrecioVentaEstimado()
                + ", estado=" + vehiculo.getEstado()
                + ", publicado=" + vehiculo.getPublicado();
    }

    private String normalizarFiltro(String valor) {
        if (valor == null) {
            return null;
        }

        String limpio = valor.trim();

        return limpio.isEmpty() ? null : limpio;
    }

}
    

