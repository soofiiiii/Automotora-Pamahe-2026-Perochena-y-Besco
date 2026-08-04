package uy.edu.ctc.pamahe.modules.taller.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.common.exception.ResourceNotFoundException;
import uy.edu.ctc.pamahe.modules.auditoria.service.AuditoriaService;
import uy.edu.ctc.pamahe.modules.taller.dto.request.RefaccionRequest;
import uy.edu.ctc.pamahe.modules.taller.dto.request.RefaccionUpdateRequest;
import uy.edu.ctc.pamahe.modules.taller.dto.response.RefaccionResponse;
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

/**
 * Gestiona trabajos de taller y su impacto en el costo y estado operativo del vehículo.
 * Distingue al usuario que registra del responsable que ejecuta y admite una clave idempotente
 * para que la sincronización offline no duplique refacciones al reintentar.
 */
@Service
public class RefaccionService {
    private final RefaccionRepository refaccionRepository;
    private final VehiculoService vehiculoService;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioActualService usuarioActualService;
    private final AuditoriaService auditoriaService;

    public RefaccionService(RefaccionRepository refaccionRepository,
                            VehiculoService vehiculoService,
                            UsuarioRepository usuarioRepository,
                            UsuarioActualService usuarioActualService,
                            AuditoriaService auditoriaService) {
        this.refaccionRepository = refaccionRepository;
        this.vehiculoService = vehiculoService;
        this.usuarioRepository = usuarioRepository;
        this.usuarioActualService = usuarioActualService;
        this.auditoriaService = auditoriaService;
    }

    @Transactional(readOnly = true)
    public List<RefaccionResponse> listar() {
        return this.refaccionRepository.findByActivoTrueOrderByFechaDesc().stream()
                .map(RefaccionMapper::toResponse)
                .toList();
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

         // El cliente offline reutiliza este identificador en cada reintento de la misma operación.
        String idOffline = this.normalizarOpcional(request.idOperacionOffline());
        if (idOffline != null) {
            var existente = this.refaccionRepository.findByIdOperacionOffline(idOffline);
            if (existente.isPresent()) {
                return RefaccionMapper.toResponse(existente.get());
            }
        }

        // El bloqueo evita que una venta o cambio de estado concurrente invalide la refacción en curso.
        Vehiculo vehiculo = this.vehiculoService.buscarActivoPorIdConBloqueo(request.vehiculoId());
        this.validarVehiculoEditable(vehiculo);
        this.validarFecha(request.fecha());
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
                Boolean.TRUE.equals(request.sincronizadoDesdeOffline()) || idOffline != null
        );

        Refaccion guardada = this.refaccionRepository.save(refaccion);
        this.sincronizarEstadoVehiculoPorTarea(vehiculo, guardada);

        this.auditoriaService.registrar(
                "ALTA",
                "Refaccion",
                guardada.getId(),
                "Registro de refacción del vehículo " + vehiculo.getId(),
                null,
                this.resumen(guardada)
        );
        return RefaccionMapper.toResponse(guardada);
    }

    @Transactional
    public RefaccionResponse actualizar(Long id, RefaccionUpdateRequest request) {
        this.usuarioActualService.exigirRoles("ADMINISTRADOR", "DUENO", "TALLER");
        Refaccion refaccion = this.buscarActiva(id);
        Vehiculo vehiculo = this.vehiculoService.buscarActivoPorIdConBloqueo(refaccion.getVehiculo().getId());
        this.validarVehiculoEditable(vehiculo);
        this.validarFecha(request.fecha());
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
                refaccion.getSincronizadoDesdeOffline()
        );
        Refaccion guardada = this.refaccionRepository.save(refaccion);
        this.sincronizarEstadoVehiculoPorTarea(vehiculo, guardada);

        this.auditoriaService.registrar(
                "MODIFICACION",
                "Refaccion",
                guardada.getId(),
                "Actualización de refacción sin reasignar el vehículo",
                anterior,
                this.resumen(guardada)
        );
        return RefaccionMapper.toResponse(guardada);
    }

    /**
     * Una tarea abierta debe reflejarse en inventario para que ventas y catálogo
     * no traten la unidad como disponible.
     */
    private void sincronizarEstadoVehiculoPorTarea(Vehiculo vehiculo, Refaccion refaccion) {
        boolean tareaAbierta = refaccion.getEstadoTarea() == EstadoTarea.PENDIENTE
                || refaccion.getEstadoTarea() == EstadoTarea.EN_CURSO;
        if (tareaAbierta
                && (vehiculo.getEstado() == EstadoVehiculo.COMPRADO
                || vehiculo.getEstado() == EstadoVehiculo.DISPONIBLE)) {
            this.vehiculoService.cambiarEstadoPorSistema(
                    vehiculo,
                    EstadoVehiculo.EN_TALLER,
                    "Ingreso automático a taller por la refacción " + refaccion.getId()
            );
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
            throw new BusinessException("No se pueden crear ni modificar refacciones después de cerrar la venta del vehículo.");
        }
        if (vehiculo.getEstado() == EstadoVehiculo.DADO_DE_BAJA) {
            throw new BusinessException("No se pueden crear ni modificar refacciones de un vehículo dado de baja.");
        }
        if (vehiculo.getEstado() == EstadoVehiculo.RESERVADO) {
            throw new BusinessException("El vehículo reservado debe volver a DISPONIBLE antes de ingresar al taller.");
        }
    }

    private void validarFecha(LocalDate fecha) {
        if (fecha.isAfter(LocalDate.now())) {
            throw new BusinessException("La fecha de la refacción no puede ser futura.");
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
        // Los costos opcionales se normalizan a cero para que la suma monetaria nunca dependa de null.
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


}




    


