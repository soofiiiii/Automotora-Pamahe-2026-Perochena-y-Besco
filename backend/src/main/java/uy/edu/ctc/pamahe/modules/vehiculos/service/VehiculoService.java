package uy.edu.ctc.pamahe.modules.vehiculos.service;

import java.math.BigDecimal;
import java.time.Year;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.common.exception.ResourceNotFoundException;
import uy.edu.ctc.pamahe.common.response.PageResponse;
import uy.edu.ctc.pamahe.common.util.MonedaUtils;
import uy.edu.ctc.pamahe.common.util.SecurityUtils;
import uy.edu.ctc.pamahe.modules.auditoria.service.AuditoriaService;
import uy.edu.ctc.pamahe.modules.compras.dto.response.CompraResponse;
import uy.edu.ctc.pamahe.modules.compras.mapper.CompraMapper;
import uy.edu.ctc.pamahe.modules.compras.model.Compra;
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
import uy.edu.ctc.pamahe.modules.vehiculos.mapper.VehiculoMapper;
import uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.repository.VehiculoRepository;
import uy.edu.ctc.pamahe.modules.ventas.dto.response.VentaDetalleGerencialResponse;
import uy.edu.ctc.pamahe.modules.ventas.dto.response.VentaResponse;
import uy.edu.ctc.pamahe.modules.ventas.mapper.VentaMapper;
import uy.edu.ctc.pamahe.modules.ventas.model.Venta;
import uy.edu.ctc.pamahe.modules.ventas.repository.VentaRepository;

/**
 * Administra la entidad central del dominio y protege su ciclo de vida mediante
 * una máquina de estados.
 * Las transiciones se validan en backend para mantener sincronizados
 * inventario, taller, catálogo y ventas
 * incluso cuando una solicitud no proviene de la interfaz prevista.
 */
@Service
public class VehiculoService {

    private static final Map<EstadoVehiculo, EnumSet<EstadoVehiculo>> TRANSICIONES = Map.of(
            EstadoVehiculo.COMPRADO,
            EnumSet.of(EstadoVehiculo.EN_TALLER, EstadoVehiculo.DISPONIBLE, EstadoVehiculo.DADO_DE_BAJA),
            EstadoVehiculo.EN_TALLER, EnumSet.of(EstadoVehiculo.DISPONIBLE, EstadoVehiculo.DADO_DE_BAJA),
            EstadoVehiculo.DISPONIBLE,
            EnumSet.of(EstadoVehiculo.RESERVADO, EstadoVehiculo.EN_TALLER, EstadoVehiculo.VENDIDO,
                    EstadoVehiculo.DADO_DE_BAJA),
            EstadoVehiculo.RESERVADO, EnumSet.of(EstadoVehiculo.DISPONIBLE, EstadoVehiculo.VENDIDO),
            EstadoVehiculo.VENDIDO, EnumSet.noneOf(EstadoVehiculo.class),
            EstadoVehiculo.DADO_DE_BAJA, EnumSet.noneOf(EstadoVehiculo.class));

    private static final Map<String, Map<EstadoVehiculo, EnumSet<EstadoVehiculo>>> TRANSICIONES_MANUALES = Map.of(
            "VENDEDOR", Map.of(
                    EstadoVehiculo.COMPRADO, EnumSet.of(EstadoVehiculo.DISPONIBLE),
                    EstadoVehiculo.DISPONIBLE, EnumSet.of(EstadoVehiculo.RESERVADO, EstadoVehiculo.EN_TALLER),
                    EstadoVehiculo.EN_TALLER, EnumSet.of(EstadoVehiculo.DISPONIBLE),
                    EstadoVehiculo.RESERVADO, EnumSet.of(EstadoVehiculo.DISPONIBLE)),
            "TALLER", Map.of(
                    EstadoVehiculo.COMPRADO, EnumSet.of(EstadoVehiculo.EN_TALLER),
                    EstadoVehiculo.DISPONIBLE, EnumSet.of(EstadoVehiculo.EN_TALLER),
                    EstadoVehiculo.EN_TALLER, EnumSet.of(EstadoVehiculo.DISPONIBLE)));

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

        Map<String, String> etiquetas = etiquetasTipoVehiculo();
        if (SecurityUtils.tieneAlgunRol("ADMINISTRADOR", "DUENO")) {
            return PageResponse.from(resultado, v -> VehiculoMapper.toResponse(v, etiquetaTipoVehiculo(v, etiquetas)));
        }
        if (SecurityUtils.tieneAlgunRol("VENDEDOR")) {
            return PageResponse.from(resultado,
                    v -> VehiculoMapper.toComercialResponse(v, etiquetaTipoVehiculo(v, etiquetas)));
        }
        if (SecurityUtils.tieneAlgunRol("TALLER")) {
            return PageResponse.from(resultado,
                    v -> VehiculoMapper.toTallerResponse(v, etiquetaTipoVehiculo(v, etiquetas)));
        }
        throw new AccessDeniedException("El rol autenticado no puede consultar vehículos.");
    }

    @Transactional(readOnly = true)
    public Object obtener(Long id) {
        Vehiculo vehiculo = this.buscarActivoPorId(id);

        String tipoVehiculoLabel = etiquetaTipoVehiculo(vehiculo, etiquetasTipoVehiculo());
        if (SecurityUtils.tieneAlgunRol("ADMINISTRADOR", "DUENO")) {
            return VehiculoMapper.toResponse(vehiculo, tipoVehiculoLabel);
        }

        if (SecurityUtils.tieneAlgunRol("VENDEDOR")) {
            return VehiculoMapper.toComercialResponse(vehiculo, tipoVehiculoLabel);
        }

        if (SecurityUtils.tieneAlgunRol("TALLER")) {
            return VehiculoMapper.toTallerResponse(vehiculo, tipoVehiculoLabel);
        }

        throw new AccessDeniedException(
                "El rol autenticado no puede consultar vehículos.");
    }

    @Transactional
    public Object crear(VehiculoRequest request) {
        return this.proyectarSegunRol(this.registrarNuevo(request));
    }

    @Transactional
    public Vehiculo crearParaCompra(VehiculoRequest request) {
        Vehiculo vehiculo = this.registrarNuevo(request);
        this.vehiculoRepository.flush();
        return vehiculo;
    }

    private Vehiculo registrarNuevo(VehiculoRequest request) {
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
                this.resumenVehiculo(guardado));
        return guardado;
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
                this.resumenVehiculo(guardado));
        return this.proyectarSegunRol(guardado);
    }

    @Transactional
    public Object cambiarEstado(Long id, CambiarEstadoVehiculoRequest request) {
        if (request.estado() == EstadoVehiculo.VENDIDO) {
            throw new BusinessException("El estado Vendido se asigna automáticamente al registrar una venta válida.");
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

        this.validarPublicacion(vehiculo, request.publicado());

        vehiculo.setPublicado(request.publicado());
        this.vehiculoRepository.save(vehiculo);

        this.auditoriaService.registrar(
                "CAMBIO_PUBLICACION",
                "Vehiculo",
                vehiculo.getId(),
                request.publicado()
                        ? "Vehículo habilitado para el catálogo"
                        : "Vehículo retirado del catálogo",
                "publicado=" + anterior,
                "publicado=" + request.publicado());

        return this.proyectarSegunRol(vehiculo);
    }

    @Transactional
    public void cambiarEstadoPorSistema(Vehiculo vehiculo, EstadoVehiculo destino, String motivo) {
        if (destino == EstadoVehiculo.VENDIDO) {
            throw new BusinessException(
                    "El estado Vendido solo puede asignarse mediante el registro de una venta válida.");
        }
        this.aplicarTransicion(vehiculo, destino, motivo, true);
    }

    @Transactional
    public void marcarVendidoPorVenta(Vehiculo vehiculo, Long ventaId) {
        if (vehiculo.getEstado() != EstadoVehiculo.DISPONIBLE) {
            throw new BusinessException(
                    "Solo se puede registrar como vendido un vehículo que esté Disponible.");
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
            throw new BusinessException(
                    "No se puede desactivar un vehículo que ya tiene operaciones registradas. Usá el estado Dado de baja cuando corresponda.");
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
                "activo=false, publicado=false");
    }

    @Transactional(readOnly = true)
    public Object historial(Long id) {
        Vehiculo vehiculo = this.buscarPorId(id);
        Compra compra = this.compraRepository.findByVehiculoAndActivoTrue(vehiculo).orElse(null);
        var refacciones = this.refaccionRepository.findByVehiculoAndActivoTrueOrderByFechaDesc(vehiculo);
        Venta venta = this.ventaRepository.findByVehiculoAndActivoTrue(vehiculo).orElse(null);
        var imagenes = this.imagenVehiculoRepository.findByVehiculoAndActivoTrueOrderByPrincipalDescIdAsc(vehiculo)
                .stream().map(ImagenVehiculoMapper::toResponse).toList();
        var eventos = this.auditoriaService.eventosVehiculo(id);
        String tipoVehiculoLabel = etiquetaTipoVehiculo(vehiculo, etiquetasTipoVehiculo());

        if (SecurityUtils.tieneAlgunRol("ADMINISTRADOR", "DUENO")) {
            return new VehiculoHistorialGerencialResponse(
                    VehiculoMapper.toResponse(vehiculo, tipoVehiculoLabel),
                    compraGerencial(compra),
                    refacciones.stream().map(RefaccionMapper::toResponse).toList(),
                    ventaGerencial(venta),
                    imagenes,
                    eventos);
        }

        if (SecurityUtils.tieneAlgunRol("VENDEDOR")) {
            return new VehiculoHistorialComercialResponse(
                    VehiculoMapper.toComercialResponse(vehiculo, tipoVehiculoLabel),
                    compraComercial(compra),
                    refacciones.stream().map(r -> new RefaccionHistorialComercialResponse(
                            r.getId(), r.getFecha(), r.getTipoTrabajo(), r.getDescripcion(), r.getEstadoTarea()))
                            .toList(),
                    ventaComercial(venta),
                    imagenes,
                    eventos);
        }

        if (SecurityUtils.tieneAlgunRol("TALLER")) {
            return new VehiculoHistorialTallerResponse(
                    VehiculoMapper.toTallerResponse(vehiculo, tipoVehiculoLabel),
                    fechaCompra(compra),
                    refacciones.stream().map(RefaccionMapper::toResponse).toList(),
                    fechaVenta(venta),
                    imagenes,
                    eventos);
        }

        throw new AccessDeniedException("El rol autenticado no puede consultar el historial del vehículo.");
    }

    private CompraResponse compraGerencial(Compra compra) {
        return compra == null ? null : CompraMapper.toResponse(compra);
    }

    private VentaDetalleGerencialResponse ventaGerencial(Venta venta) {
        return venta == null ? null : VentaMapper.toDetalleGerencial(venta);
    }

    private VentaResponse ventaComercial(Venta venta) {
        return venta == null ? null : VentaMapper.toResponse(venta);
    }

    private CompraHistorialComercialResponse compraComercial(Compra compra) {
        if (compra == null) {
            return null;
        }
        String nombreCliente = compra.getClienteVendedor().getNombre();
        String apellidoCliente = compra.getClienteVendedor().getApellido();
        if (apellidoCliente != null && !apellidoCliente.isBlank()) {
            nombreCliente = nombreCliente + " " + apellidoCliente.trim();
        }
        return new CompraHistorialComercialResponse(
                compra.getId(), compra.getClienteVendedor().getId(), nombreCliente, compra.getFechaCompra());
    }

    private java.time.LocalDate fechaCompra(Compra compra) {
        return compra == null ? null : compra.getFechaCompra();
    }

    private java.time.LocalDate fechaVenta(Venta venta) {
        return venta == null ? null : venta.getFechaVenta();
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
            throw new ResourceNotFoundException("El vehículo solicitado no existe o ya no está disponible.");
        }
        return vehiculo;
    }

    @Transactional
    public Vehiculo buscarActivoPorIdConBloqueo(Long id) {
        Vehiculo vehiculo = this.vehiculoRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el vehículo solicitado."));
        if (!Boolean.TRUE.equals(vehiculo.getActivo())) {
            throw new ResourceNotFoundException("El vehículo solicitado no existe o ya no está disponible.");
        }
        return vehiculo;
    }

    private void validarPermisoTransicionManual(EstadoVehiculo origen, EstadoVehiculo destino) {
        if (SecurityUtils.tieneAlgunRol("ADMINISTRADOR", "DUENO")) {
            return;
        }
        if (transicionManualPermitida("VENDEDOR", origen, destino)) {
            return;
        }
        if (transicionManualPermitida("TALLER", origen, destino)) {
            return;
        }
        throw new AccessDeniedException("El rol autenticado no puede realizar esta transición de estado.");
    }

    private boolean transicionManualPermitida(String rol, EstadoVehiculo origen, EstadoVehiculo destino) {
        if (!SecurityUtils.tieneAlgunRol(rol)) {
            return false;
        }
        Map<EstadoVehiculo, EnumSet<EstadoVehiculo>> porOrigen = TRANSICIONES_MANUALES.get(rol);
        return porOrigen.getOrDefault(origen, EnumSet.noneOf(EstadoVehiculo.class)).contains(destino);
    }

    private void aplicarTransicion(Vehiculo vehiculo,
            EstadoVehiculo destino,
            String motivo,
            boolean operacionInterna) {
        EstadoVehiculo origen = vehiculo.getEstado();
        validarTransicionBasica(origen, destino, operacionInterna);
        validarCompraActivaParaAvance(vehiculo, origen, destino);
        validarTareasCerradasParaDisponible(vehiculo, origen, destino);

        vehiculo.setEstado(destino);
        despublicarSiNoComercializable(vehiculo, destino);
        this.vehiculoRepository.save(vehiculo);
        this.auditoriaService.registrar(
                "CAMBIO_ESTADO",
                "Vehiculo",
                vehiculo.getId(),
                normalizarMotivoTransicion(motivo),
                "estado=" + origen,
                "estado=" + destino + ", publicado=" + vehiculo.getPublicado());
    }

    private void validarTransicionBasica(EstadoVehiculo origen, EstadoVehiculo destino, boolean operacionInterna) {
        if (origen == destino) {
            throw new BusinessException("El vehículo ya se encuentra en estado " + estadoLegible(destino) + ".");
        }
        if (!TRANSICIONES.getOrDefault(origen, EnumSet.noneOf(EstadoVehiculo.class)).contains(destino)) {
            throw new BusinessException(
                    "No se puede cambiar el estado de " + estadoLegible(origen) + " a " + estadoLegible(destino) + ".");
        }
        if (destino == EstadoVehiculo.VENDIDO && !operacionInterna) {
            throw new BusinessException("El estado Vendido se asigna automáticamente al registrar una venta.");
        }
    }

    private void validarCompraActivaParaAvance(Vehiculo vehiculo, EstadoVehiculo origen, EstadoVehiculo destino) {
        if (origen == EstadoVehiculo.COMPRADO
                && destino != EstadoVehiculo.DADO_DE_BAJA
                && !this.compraRepository.existsByVehiculoAndActivoTrue(vehiculo)) {
            throw new BusinessException(
                    "El vehículo debe tener una compra activa antes de avanzar en su ciclo operativo.");
        }
    }

    private void validarTareasCerradasParaDisponible(Vehiculo vehiculo, EstadoVehiculo origen, EstadoVehiculo destino) {
        if (origen != EstadoVehiculo.EN_TALLER || destino != EstadoVehiculo.DISPONIBLE) {
            return;
        }
        boolean tieneTareasAbiertas = this.refaccionRepository.existsByVehiculoAndActivoTrueAndEstadoTareaIn(
                vehiculo, List.of(EstadoTarea.PENDIENTE, EstadoTarea.EN_CURSO));
        if (tieneTareasAbiertas) {
            throw new BusinessException(
                    "No se puede marcar el vehículo como Disponible mientras tenga tareas pendientes o en curso.");
        }
    }

    private static String estadoLegible(EstadoVehiculo estado) {
        return switch (estado) {
            case COMPRADO -> "Comprado";
            case EN_TALLER -> "En taller";
            case DISPONIBLE -> "Disponible";
            case RESERVADO -> "Reservado";
            case VENDIDO -> "Vendido";
            case DADO_DE_BAJA -> "Dado de baja";
        };
    }

    private void despublicarSiNoComercializable(Vehiculo vehiculo, EstadoVehiculo destino) {
        if (destino != EstadoVehiculo.DISPONIBLE && destino != EstadoVehiculo.RESERVADO) {
            vehiculo.setPublicado(false);
        }
    }

    private String normalizarMotivoTransicion(String motivo) {
        return motivo == null || motivo.isBlank() ? "Cambio controlado de estado" : motivo.trim();
    }

    private void cargarDatosEditables(Vehiculo vehiculo, VehiculoRequest request) {
        this.validarAnioVehiculo(request.anio());
        vehiculo.setMarca(request.marca().trim());
        vehiculo.setModelo(request.modelo().trim());
        vehiculo.setTipoVehiculo(validarTipoVehiculo(request.tipoVehiculo(), vehiculo.getTipoVehiculo()));
        vehiculo.setAnio(request.anio());
        vehiculo.setMatricula(this.normalizarOpcional(request.matricula()));
        vehiculo.setNumeroChasis(this.normalizarOpcional(request.numeroChasis()));
        vehiculo.setColor(this.normalizarOpcional(request.color()));
        vehiculo.setKilometraje(request.kilometraje());
        vehiculo.setUbicacionActual(request.ubicacionActual());
        cargarPrecioComercial(vehiculo, request);
        vehiculo.setDescripcionPublica(this.normalizarOpcional(request.descripcionPublica()));

        String observacionesSolicitadas = this.normalizarOpcional(request.observacionesInternas());
        if (SecurityUtils.tieneAlgunRol("ADMINISTRADOR", "DUENO")) {
            vehiculo.setObservacionesInternas(observacionesSolicitadas);
        } else if (observacionesSolicitadas != null) {
            throw new AccessDeniedException(
                    "Solo ADMINISTRADOR o DUENO pueden modificar observaciones internas del vehículo.");
        }
    }

    private Object proyectarSegunRol(Vehiculo vehiculo) {
        String tipoVehiculoLabel = etiquetaTipoVehiculo(vehiculo, etiquetasTipoVehiculo());
        if (SecurityUtils.tieneAlgunRol("ADMINISTRADOR", "DUENO")) {
            return VehiculoMapper.toResponse(vehiculo, tipoVehiculoLabel);
        }
        if (SecurityUtils.tieneAlgunRol("VENDEDOR")) {
            return VehiculoMapper.toComercialResponse(vehiculo, tipoVehiculoLabel);
        }
        if (SecurityUtils.tieneAlgunRol("TALLER")) {
            return VehiculoMapper.toTallerResponse(vehiculo, tipoVehiculoLabel);
        }
        throw new AccessDeniedException("El rol autenticado no puede recibir información del vehículo.");
    }

    private void validarAnioVehiculo(Integer anio) {
        int maximo = Year.now().getValue();
        if (anio == null || anio < 1900 || anio > maximo) {
            throw new BusinessException(
                    "El año del vehículo debe estar entre 1900 y " + maximo + ".");
        }
    }

    private String normalizarOpcional(String valor) {
        if (valor == null) {
            return null;
        }
        String limpio = valor.trim();
        return limpio.isEmpty() ? null : limpio;
    }

    private List<?> proyectarListaSegunRol(List<Vehiculo> vehiculos) {
        Map<String, String> etiquetas = etiquetasTipoVehiculo();
        if (SecurityUtils.tieneAlgunRol("ADMINISTRADOR", "DUENO")) {
            return vehiculos.stream()
                    .map(v -> VehiculoMapper.toResponse(v, etiquetaTipoVehiculo(v, etiquetas)))
                    .toList();
        }
        if (SecurityUtils.tieneAlgunRol("VENDEDOR")) {
            return vehiculos.stream()
                    .map(v -> VehiculoMapper.toComercialResponse(v, etiquetaTipoVehiculo(v, etiquetas)))
                    .toList();
        }
        if (SecurityUtils.tieneAlgunRol("TALLER")) {
            return vehiculos.stream()
                    .map(v -> VehiculoMapper.toTallerResponse(v, etiquetaTipoVehiculo(v, etiquetas)))
                    .toList();
        }
        throw new AccessDeniedException("El rol autenticado no puede consultar vehículos.");
    }

    private Map<String, String> etiquetasTipoVehiculo() {
        return this.parametroRepository.findByCategoriaOrderByClaveAsc("TIPO_VEHICULO").stream()
                .collect(Collectors.toMap(
                        p -> p.getClave().trim().toUpperCase(java.util.Locale.ROOT),
                        p -> p.getValor() == null || p.getValor().isBlank() ? p.getClave() : p.getValor().trim(),
                        (primero, segundo) -> primero));
    }

    private String etiquetaTipoVehiculo(Vehiculo vehiculo, Map<String, String> etiquetas) {
        String clave = normalizarClave(vehiculo.getTipoVehiculo());
        return clave == null ? null : etiquetas.getOrDefault(clave, clave);
    }

    private void validarFiltrosStock(Integer anioDesde, Integer anioHasta, BigDecimal precioMin, BigDecimal precioMax) {
        validarRangoAnios(anioDesde, anioHasta);
        validarPrecioNoNegativo(precioMin);
        validarPrecioNoNegativo(precioMax);
        validarRangoPrecios(precioMin, precioMax);
    }

    private void validarRangoAnios(Integer anioDesde, Integer anioHasta) {
        int maximo = Year.now().getValue();

        validarAnioFiltro(anioDesde, maximo);
        validarAnioFiltro(anioHasta, maximo);

        if (anioDesde != null && anioHasta != null && anioDesde > anioHasta) {
            throw new BusinessException("El año desde no puede ser mayor que el año hasta.");
        }
    }

    private void validarAnioFiltro(Integer anio, int maximo) {
        if (anio == null) {
            return;
        }

        if (anio < 1900 || anio > maximo) {
            throw new BusinessException("Los años de filtro deben estar entre 1900 y " + maximo + ".");
        }
    }

    private void validarPrecioNoNegativo(BigDecimal precio) {
        if (precio != null && precio.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("Los filtros de precio no pueden ser negativos.");
        }
    }

    private void validarRangoPrecios(BigDecimal precioMin, BigDecimal precioMax) {
        if (precioMin != null && precioMax != null && precioMin.compareTo(precioMax) > 0) {
            throw new BusinessException("El precio mínimo no puede ser mayor que el precio máximo.");
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

    private void cargarPrecioComercial(Vehiculo vehiculo, VehiculoRequest request) {
        BigDecimal cotizacion = cotizacionUsdUyu();

        if (request.precioVentaUsd() != null) {
            vehiculo.setPrecioVentaUsd(request.precioVentaUsd());
            vehiculo.setPrecioVentaEstimado(MonedaUtils.convertirUsdAUyu(request.precioVentaUsd(), cotizacion));
            return;
        }

        // Compatibilidad con clientes anteriores que todavía envían el precio principal en UYU.
        BigDecimal precioUyu = request.precioVentaEstimado() == null
                ? BigDecimal.ZERO
                : request.precioVentaEstimado();
        vehiculo.setPrecioVentaEstimado(precioUyu);
        vehiculo.setPrecioVentaUsd(MonedaUtils.convertirUyuAUsd(precioUyu, cotizacion));
    }

    private BigDecimal cotizacionUsdUyu() {
        return this.parametroRepository
                .findByCategoriaAndClaveAndActivoTrue(MonedaUtils.CATEGORIA_MONEDA, MonedaUtils.CLAVE_USD_UYU)
                .map(parametro -> MonedaUtils.parsearCotizacionUsdUyu(parametro.getValor()))
                .orElse(MonedaUtils.COTIZACION_USD_UYU_PREDETERMINADA);
    }

    private String validarTipoVehiculo(String tipoVehiculo, String tipoActual) {
        String clave = normalizarClave(tipoVehiculo);
        if (clave == null) {
            return null;
        }

        if (clave.equals(normalizarClave(tipoActual))) {
            return clave;
        }

        if (this.parametroRepository.findByCategoriaAndClaveAndActivoTrue("TIPO_VEHICULO", clave).isEmpty()) {
            throw new BusinessException("El tipo de vehículo seleccionado ya no está disponible. Elegí otro tipo.");
        }
        return clave;
    }

    private void validarPublicacion(Vehiculo vehiculo, Boolean publicar) {
        if (!Boolean.TRUE.equals(publicar)) {
            return;
        }

        this.validarEstadoPublicable(vehiculo.getEstado());
        this.validarPrecioPublicable(vehiculo.getPrecioVentaUsd());
    }

    private void validarEstadoPublicable(EstadoVehiculo estado) {
        boolean estadoPermitido = estado == EstadoVehiculo.DISPONIBLE
                || estado == EstadoVehiculo.RESERVADO;

        if (!estadoPermitido) {
            throw new BusinessException(
                    "Solo se pueden publicar vehículos que estén Disponibles o Reservados.");
        }
    }

    private void validarPrecioPublicable(BigDecimal precioVentaUsd) {
        if (precioVentaUsd == null
                || precioVentaUsd.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(
                    "Para publicar un vehículo debe existir un precio de venta estimado en USD mayor que cero.");
        }
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
                + ", precioVentaUsd=" + vehiculo.getPrecioVentaUsd()
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
