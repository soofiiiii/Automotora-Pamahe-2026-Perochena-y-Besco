package uy.edu.ctc.pamahe.modules.taller.service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.util.HexFormat;
import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;
import org.springframework.data.domain.PageRequest;
import uy.edu.ctc.pamahe.common.response.PageResponse;
import org.springframework.transaction.annotation.Transactional;

import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.common.exception.ResourceNotFoundException;
import uy.edu.ctc.pamahe.common.exception.IdempotencyConflictException;
import uy.edu.ctc.pamahe.modules.auditoria.service.AuditoriaService;
import uy.edu.ctc.pamahe.modules.taller.dto.request.RefaccionRequest;
import uy.edu.ctc.pamahe.modules.taller.dto.request.RefaccionUpdateRequest;
import uy.edu.ctc.pamahe.modules.taller.dto.response.RefaccionResponse;
import uy.edu.ctc.pamahe.modules.taller.idempotency.RefaccionOperacionOffline;
import uy.edu.ctc.pamahe.modules.taller.idempotency.RefaccionOperacionOfflineRepository;
import uy.edu.ctc.pamahe.modules.taller.mapper.RefaccionMapper;
import uy.edu.ctc.pamahe.modules.taller.model.EstadoTarea;
import uy.edu.ctc.pamahe.modules.taller.model.Refaccion;
import uy.edu.ctc.pamahe.modules.taller.repository.RefaccionRepository;
import uy.edu.ctc.pamahe.modules.usuarios.model.Usuario;
import uy.edu.ctc.pamahe.modules.usuarios.repository.UsuarioRepository;
import uy.edu.ctc.pamahe.modules.usuarios.service.UsuarioActualService;
import uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.service.VehiculoService;
import uy.edu.ctc.pamahe.modules.compras.model.Compra;
import uy.edu.ctc.pamahe.modules.compras.repository.CompraRepository;

/**
 * Gestiona trabajos de taller y su impacto en el costo y estado operativo del vehículo.
 * Distingue al usuario que registra del responsable que ejecuta y admite una clave idempotente
 * para que la sincronización offline no duplique refacciones al reintentar.
 */
@Service
public class RefaccionService {
    private final RefaccionRepository refaccionRepository;
    private final RefaccionOperacionOfflineRepository operacionOfflineRepository;
    private final VehiculoService vehiculoService;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioActualService usuarioActualService;
    private final AuditoriaService auditoriaService;
    private final CompraRepository compraRepository;

    public RefaccionService(RefaccionRepository refaccionRepository,
            RefaccionOperacionOfflineRepository operacionOfflineRepository,
            VehiculoService vehiculoService,
            UsuarioRepository usuarioRepository,
            UsuarioActualService usuarioActualService,
            AuditoriaService auditoriaService,
            CompraRepository compraRepository) {
        this.refaccionRepository = refaccionRepository;
        this.operacionOfflineRepository = operacionOfflineRepository;
        this.vehiculoService = vehiculoService;
        this.usuarioRepository = usuarioRepository;
        this.usuarioActualService = usuarioActualService;
        this.auditoriaService = auditoriaService;
        this.compraRepository = compraRepository;
    }

    @Transactional(readOnly = true)
    public List<RefaccionResponse> listar() {
        return this.refaccionRepository.findByActivoTrueOrderByFechaDesc().stream()
                .map(RefaccionMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<RefaccionResponse> listarPaginado(
            EstadoTarea estado,
            int page,
            int size) {

        validarPaginacion(page, size);

        var pageable = PageRequest.of(page, size);

        if (estado != null) {
            var resultado = this.refaccionRepository
                    .findByEstadoTareaAndActivoTrueOrderByFechaAsc(estado, pageable);

            return PageResponse.from(resultado, RefaccionMapper::toResponse);
        }

        var resultado = this.refaccionRepository
                .findByActivoTrueOrderByFechaDesc(pageable);

        return PageResponse.from(resultado, RefaccionMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public List<RefaccionResponse> listarPorEstado(EstadoTarea estado) {
        return this.refaccionRepository.findByEstadoTareaAndActivoTrueOrderByFechaAsc(estado).stream()
                .map(RefaccionMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RefaccionResponse> listarPorVehiculo(Long vehiculoId) {
        Vehiculo vehiculo = this.vehiculoService.buscarActivoPorId(vehiculoId);
        return this.refaccionRepository.findByVehiculoAndActivoTrueOrderByFechaDesc(vehiculo).stream()
                .map(RefaccionMapper::toResponse)
                .toList();
    }

    @Transactional
    public RefaccionResponse crear(RefaccionRequest request) {
        Usuario usuarioQueRegistra = this.usuarioActualService.exigirRoles("ADMINISTRADOR", "DUENO", "TALLER");
        String idOffline = this.normalizarOpcional(request.idOperacionOffline());

        if (idOffline != null) {
            var existente = this.refaccionRepository.findByIdOperacionOffline(idOffline);
            if (existente.isPresent()) {
                validarMismoPayload(existente.get(), request);
                return RefaccionMapper.toResponse(existente.get());
            }
        }

        RefaccionOperacionOffline reserva = idOffline == null ? null : reservarOperacion(idOffline, request);
        if (reserva != null && reserva.getRefaccionId() != null) {
            Refaccion existente = this.refaccionRepository.findByIdConBloqueoLectura(reserva.getRefaccionId())
                    .orElseThrow(() -> new IllegalStateException(
                            "La reserva idempotente referencia una refacción inexistente. Revisar integridad de la base."));
            validarMismoPayload(existente, request);
            return RefaccionMapper.toResponse(existente);
        }

        Vehiculo vehiculo = this.vehiculoService.buscarActivoPorIdConBloqueo(request.vehiculoId());
        this.validarVehiculoEditable(vehiculo);
        this.validarFecha(vehiculo, request.fecha());
        Usuario responsable = this.buscarResponsableActivo(request.responsableOperativoId());

        Refaccion refaccion = new Refaccion();
        refaccion.setVehiculo(vehiculo);
        refaccion.setUsuarioQueRegistra(usuarioQueRegistra);
        refaccion.setIdOperacionOffline(idOffline);
        this.cargarDatos(
                refaccion,
                responsable,
                request.fecha(),
                request.tipoTrabajo(),
                request.descripcion(),
                request.costoRepuestos(),
                request.costoManoObra(),
                request.costoServiciosExternos(),
                request.estadoTarea() == null ? EstadoTarea.PENDIENTE : request.estadoTarea(),
                request.observaciones(),
                request.registroFotograficoUrl(),
                Boolean.TRUE.equals(request.sincronizadoDesdeOffline()) || idOffline != null);

        Refaccion guardada = this.refaccionRepository.save(refaccion);
        if (reserva != null) {
            reserva.setRefaccionId(guardada.getId());
            this.operacionOfflineRepository.save(reserva);
        }
        this.sincronizarEstadoVehiculoPorTarea(vehiculo, guardada);

        this.auditoriaService.registrar(
                "ALTA",
                "Refaccion",
                guardada.getId(),
                "Registro de refacción del vehículo " + vehiculo.getId(),
                null,
                this.resumen(guardada));
        return RefaccionMapper.toResponse(guardada);
    }

    @Transactional
    public RefaccionResponse actualizar(Long id, RefaccionUpdateRequest request) {
        this.usuarioActualService.exigirRoles("ADMINISTRADOR", "DUENO", "TALLER");
        Refaccion refaccion = this.buscarActiva(id);
        Vehiculo vehiculo = this.vehiculoService.buscarActivoPorIdConBloqueo(refaccion.getVehiculo().getId());
        this.validarVehiculoEditable(vehiculo);
        this.validarFecha(vehiculo, request.fecha());
        Usuario responsable = this.buscarResponsableActivo(request.responsableOperativoId());
        String anterior = this.resumen(refaccion);

        this.cargarDatos(
                refaccion,
                responsable,
                request.fecha(),
                request.tipoTrabajo(),
                request.descripcion(),
                request.costoRepuestos(),
                request.costoManoObra(),
                request.costoServiciosExternos(),
                request.estadoTarea(),
                request.observaciones(),
                request.registroFotograficoUrl(),
                refaccion.getSincronizadoDesdeOffline());
        Refaccion guardada = this.refaccionRepository.save(refaccion);
        this.sincronizarEstadoVehiculoPorTarea(vehiculo, guardada);

        this.auditoriaService.registrar(
                "MODIFICACION",
                "Refaccion",
                guardada.getId(),
                "Actualización de refacción sin reasignar el vehículo",
                anterior,
                this.resumen(guardada));
        return RefaccionMapper.toResponse(guardada);
    }

    private RefaccionOperacionOffline reservarOperacion(String idOffline, RefaccionRequest request) {
        String requestHash = hashOperacion(request);
        this.operacionOfflineRepository.reservarSiAusente(idOffline, requestHash);
        RefaccionOperacionOffline reserva = this.operacionOfflineRepository.bloquearPorId(idOffline)
                .orElseThrow(() -> new IllegalStateException(
                        "No fue posible adquirir la reserva idempotente para la operación offline."));
        if (!Objects.equals(reserva.getRequestHash(), requestHash)) {
            throw new IdempotencyConflictException(
                    "El identificador de operación offline ya fue utilizado con datos diferentes.");
        }
        return reserva;
    }

    private void validarMismoPayload(Refaccion existente, RefaccionRequest request) {
        if (!mismaOperacionOffline(existente, request)) {
            throw new IdempotencyConflictException(
                    "El identificador de operación offline ya fue utilizado con datos diferentes.");
        }
    }

    private void sincronizarEstadoVehiculoPorTarea(Vehiculo vehiculo, Refaccion refaccion) {
        boolean tareaAbierta = refaccion.getEstadoTarea() == EstadoTarea.PENDIENTE
                || refaccion.getEstadoTarea() == EstadoTarea.EN_CURSO;
        if (tareaAbierta
                && (vehiculo.getEstado() == EstadoVehiculo.COMPRADO
                        || vehiculo.getEstado() == EstadoVehiculo.DISPONIBLE)) {
            this.vehiculoService.cambiarEstadoPorSistema(
                    vehiculo,
                    EstadoVehiculo.EN_TALLER,
                    "Ingreso automático a taller por la refacción " + refaccion.getId());
        }
    }

    private Refaccion buscarActiva(Long id) {
        Refaccion refaccion = this.refaccionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró la refacción solicitada."));
        if (!Boolean.TRUE.equals(refaccion.getActivo())) {
            throw new ResourceNotFoundException("No se encontró una refacción activa con el identificador solicitado.");
        }
        return refaccion;
    }

    private void validarVehiculoEditable(Vehiculo vehiculo) {
        if (vehiculo.getEstado() == EstadoVehiculo.VENDIDO) {
            throw new BusinessException(
                    "No se pueden crear ni modificar refacciones después de cerrar la venta del vehículo.");
        }
        if (vehiculo.getEstado() == EstadoVehiculo.DADO_DE_BAJA) {
            throw new BusinessException("No se pueden crear ni modificar refacciones de un vehículo dado de baja.");
        }
        if (vehiculo.getEstado() == EstadoVehiculo.RESERVADO) {
            throw new BusinessException("El vehículo reservado debe volver a DISPONIBLE antes de ingresar al taller.");
        }
    }

    private void validarFecha(Vehiculo vehiculo, LocalDate fecha) {
        if (fecha == null) {
            throw new BusinessException("La fecha de la refacción es obligatoria.");
        }
        if (fecha.isAfter(LocalDate.now())) {
            throw new BusinessException(
                    "La fecha de la refacción no puede ser futura.");
        }

        Compra compra = this.compraRepository.findByVehiculoAndActivoTrue(vehiculo)
                .orElseThrow(() -> new BusinessException(
                        "No se puede registrar una refacción porque el vehículo no tiene una compra activa."));

        if (fecha.isBefore(compra.getFechaCompra())) {
            throw new BusinessException(
                    "La fecha de la refacción no puede ser anterior a la fecha de compra del vehículo.");
        }
    }

    private Usuario buscarResponsableActivo(Long responsableId) {
        if (responsableId == null) {
            return null;
        }
        Usuario responsable = this.usuarioRepository.findById(responsableId)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el responsable operativo indicado."));
        if (!Boolean.TRUE.equals(responsable.getActivo())) {
            throw new BusinessException("El responsable operativo seleccionado se encuentra inactivo.");
        }
        boolean rolPermitido = responsable.getRoles().stream()
                .anyMatch(rol -> rol.getNombre().equals("TALLER")
                        || rol.getNombre().equals("ADMINISTRADOR")
                        || rol.getNombre().equals("DUENO"));
        if (!rolPermitido) {
            throw new BusinessException("El responsable operativo debe tener rol taller, administrador o dueño.");
        }
        return responsable;
    }

    private void cargarDatos(Refaccion refaccion,
            Usuario responsable,
            LocalDate fecha,
            uy.edu.ctc.pamahe.modules.taller.model.TipoTrabajo tipoTrabajo,
            String descripcion,
            BigDecimal costoRepuestos,
            BigDecimal costoManoObra,
            BigDecimal costoServiciosExternos,
            EstadoTarea estadoTarea,
            String observaciones,
            String registroFotograficoUrl,
            Boolean sincronizadoDesdeOffline) {
        refaccion.setResponsableOperativo(responsable);
        refaccion.setFecha(fecha);
        refaccion.setTipoTrabajo(tipoTrabajo);
        refaccion.setDescripcion(descripcion.trim());
        refaccion.setCostoRepuestos(costoRepuestos == null ? BigDecimal.ZERO : costoRepuestos);
        refaccion.setCostoManoObra(costoManoObra == null ? BigDecimal.ZERO : costoManoObra);
        refaccion.setCostoServiciosExternos(costoServiciosExternos == null ? BigDecimal.ZERO : costoServiciosExternos);
        refaccion.setEstadoTarea(estadoTarea);
        refaccion.setObservaciones(this.normalizarOpcional(observaciones));
        refaccion.setRegistroFotograficoUrl(this.normalizarOpcional(registroFotograficoUrl));
        refaccion.setSincronizadoDesdeOffline(Boolean.TRUE.equals(sincronizadoDesdeOffline));
    }

    private String normalizarOpcional(String valor) {
        if (valor == null) {
            return null;
        }
        String limpio = valor.trim();
        return limpio.isEmpty() ? null : limpio;
    }

    private String resumen(Refaccion refaccion) {
        return "vehiculoId=" + refaccion.getVehiculo().getId()
                + ", estadoTarea=" + refaccion.getEstadoTarea()
                + ", costoRepuestos=" + refaccion.getCostoRepuestos()
                + ", costoManoObra=" + refaccion.getCostoManoObra()
                + ", costoServiciosExternos=" + refaccion.getCostoServiciosExternos()
                + ", costoTotal=" + refaccion.costoTotal();
    }

    private boolean mismaOperacionOffline(Refaccion existente, RefaccionRequest request) {
        EstadoTarea estadoSolicitado = request.estadoTarea() == null ? EstadoTarea.PENDIENTE : request.estadoTarea();
        return existente.getVehiculo().getId().equals(request.vehiculoId())
                && Objects.equals(
                        existente.getResponsableOperativo() == null ? null : existente.getResponsableOperativo().getId(),
                        request.responsableOperativoId())
                && Objects.equals(existente.getFecha(), request.fecha())
                && Objects.equals(existente.getTipoTrabajo(), request.tipoTrabajo())
                && Objects.equals(existente.getDescripcion(), normalizarRequerido(request.descripcion()))
                && compararMoneda(existente.getCostoRepuestos(), costo(request.costoRepuestos()))
                && compararMoneda(existente.getCostoManoObra(), costo(request.costoManoObra()))
                && compararMoneda(existente.getCostoServiciosExternos(), costo(request.costoServiciosExternos()))
                && Objects.equals(existente.getEstadoTarea(), estadoSolicitado)
                && Objects.equals(existente.getObservaciones(), normalizarOpcional(request.observaciones()))
                && Objects.equals(existente.getRegistroFotograficoUrl(), normalizarOpcional(request.registroFotograficoUrl()));
    }

    private String hashOperacion(RefaccionRequest request) {
        String canonical = String.join("|",
                value(request.vehiculoId()),
                value(request.responsableOperativoId()),
                value(request.fecha()),
                value(request.tipoTrabajo()),
                value(normalizarRequerido(request.descripcion())),
                value(normalizarMoneda(costo(request.costoRepuestos()))),
                value(normalizarMoneda(costo(request.costoManoObra()))),
                value(normalizarMoneda(costo(request.costoServiciosExternos()))),
                value(request.estadoTarea() == null ? EstadoTarea.PENDIENTE : request.estadoTarea()),
                value(normalizarOpcional(request.observaciones())),
                value(normalizarOpcional(request.registroFotograficoUrl())));
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(canonical.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 no está disponible en la JVM.", exception);
        }
    }

    private String value(Object value) {
        return value == null ? "<null>" : value.toString();
    }

    private String normalizarRequerido(String value) {
        return value == null ? null : value.trim();
    }

    private BigDecimal costo(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private BigDecimal normalizarMoneda(BigDecimal value) {
        return value.stripTrailingZeros();
    }

    private boolean compararMoneda(BigDecimal left, BigDecimal right) {
        if (left == null || right == null) {
            return left == right;
        }
        return left.compareTo(right) == 0;
    }

    private void validarPaginacion(int page, int size) {
        if (page < 0) {
            throw new BusinessException("La página no puede ser negativa.");
        }

        if (size < 1 || size > 100) {
            throw new BusinessException("El tamaño de página debe estar entre 1 y 100.");
        }
    }
}
