package uy.edu.ctc.pamahe.modules.notificaciones.service;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import uy.edu.ctc.pamahe.common.exception.ResourceNotFoundException;
import uy.edu.ctc.pamahe.modules.notificaciones.dto.response.NotificacionResponse;
import uy.edu.ctc.pamahe.modules.notificaciones.model.Notificacion;
import uy.edu.ctc.pamahe.modules.notificaciones.model.TipoNotificacion;
import uy.edu.ctc.pamahe.modules.notificaciones.repository.NotificacionRepository;
import uy.edu.ctc.pamahe.modules.taller.model.EstadoTarea;
import uy.edu.ctc.pamahe.modules.taller.repository.RefaccionRepository;
import uy.edu.ctc.pamahe.modules.usuarios.model.Usuario;
import uy.edu.ctc.pamahe.modules.usuarios.repository.UsuarioRepository;
import uy.edu.ctc.pamahe.modules.usuarios.service.UsuarioActualService;
import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;
import uy.edu.ctc.pamahe.modules.ventas.model.Venta;
import uy.edu.ctc.pamahe.modules.ventas.repository.VentaRepository;

@Service
public class NotificacionService {

    private static final TipoNotificacion TIPO_LISTO_REVISION = TipoNotificacion.VEHICULO_LISTO_REVISION;
    private static final TipoNotificacion TIPO_SEGUIMIENTO_POSTVENTA = TipoNotificacion.SEGUIMIENTO_POSTVENTA;
    private static final TipoNotificacion TIPO_PROXIMO_MANTENIMIENTO = TipoNotificacion.PROXIMO_MANTENIMIENTO;

    private final NotificacionRepository notificacionRepository;
    private final UsuarioRepository usuarioRepository;
    private final RefaccionRepository refaccionRepository;
    private final VentaRepository ventaRepository;
    private final UsuarioActualService usuarioActualService;

    public NotificacionService(
            NotificacionRepository notificacionRepository,
            UsuarioRepository usuarioRepository,
            RefaccionRepository refaccionRepository,
            VentaRepository ventaRepository,
            UsuarioActualService usuarioActualService) {
        this.notificacionRepository = notificacionRepository;
        this.usuarioRepository = usuarioRepository;
        this.refaccionRepository = refaccionRepository;
        this.ventaRepository = ventaRepository;
        this.usuarioActualService = usuarioActualService;
    }

    @Transactional(readOnly = true)
    public List<NotificacionResponse> listarActuales() {
        Usuario usuario = this.usuarioActualService.exigirRoles("ADMINISTRADOR", "DUENO", "VENDEDOR");
        return this.notificacionRepository.findByUsuarioAndActivoTrueAndLeidaFalseOrderByCreadoEnDesc(usuario)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public NotificacionResponse marcarLeida(Long id) {
        Usuario usuario = this.usuarioActualService.exigirRoles("ADMINISTRADOR", "DUENO", "VENDEDOR");
        Notificacion notificacion = this.notificacionRepository.findByIdAndUsuarioAndActivoTrue(id, usuario)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró la notificación solicitada."));
        notificacion.setLeida(true);
        return toResponse(this.notificacionRepository.save(notificacion));
    }

    /**
     * Mantiene una única alerta activa por destinatario y vehículo mientras todas
     * las tareas activas estén finalizadas. La alerta no modifica el estado del vehículo.
     */
    @Transactional
    public void reconciliarVehiculoListoParaRevision(Vehiculo vehiculo) {
        boolean tieneTareas = this.refaccionRepository.existsByVehiculoAndActivoTrue(vehiculo);
        boolean tieneTareasNoFinalizadas = this.refaccionRepository
                .existsByVehiculoAndActivoTrueAndEstadoTareaNot(vehiculo, EstadoTarea.FINALIZADA);

        if (!tieneTareas || tieneTareasNoFinalizadas) {
            desactivarAlertasListoRevision(vehiculo);
            return;
        }

        List<Usuario> destinatarios = this.usuarioRepository
                .buscarActivosPorRoles(List.of("DUENO", "VENDEDOR"));

        for (Usuario usuario : destinatarios) {
            if (this.notificacionRepository.existsByUsuarioAndVehiculoAndTipoAndActivoTrue(
                    usuario, vehiculo, TIPO_LISTO_REVISION)) {
                continue;
            }

            Notificacion notificacion = new Notificacion();
            notificacion.setUsuario(usuario);
            notificacion.setVehiculo(vehiculo);
            notificacion.setTipo(TIPO_LISTO_REVISION);
            notificacion.setTitulo("Vehículo listo para revisión");
            notificacion.setMensaje(nombreVehiculo(vehiculo)
                    + " completó todas las tareas de taller. Revisá la unidad antes de marcarla como Disponible.");
            notificacion.setLeida(false);
            notificacion.setUrlDestino("/app/vehiculos/" + vehiculo.getId());
            this.notificacionRepository.save(notificacion);
        }
    }

    /** Genera una única alerta postventa para el vendedor responsable de cada venta vencida. */
    @Transactional
    public void generarSeguimientosPostventaVencidos(LocalDate fechaLimite) {
        if (fechaLimite == null) {
            return;
        }

        List<Venta> pendientes = this.ventaRepository
                .findByActivoTrueAndSeguimientoPostventaRealizadoFalseAndFechaVentaLessThanEqualOrderByFechaVentaAsc(
                        fechaLimite);

        for (Venta venta : pendientes) {
            Usuario vendedor = venta.getVendedor();
            if (vendedor == null || !Boolean.TRUE.equals(vendedor.getActivo())) {
                continue;
            }
            if (this.notificacionRepository.existsByUsuarioAndVentaAndTipoAndActivoTrue(
                    vendedor, venta, TIPO_SEGUIMIENTO_POSTVENTA)) {
                continue;
            }

            Notificacion notificacion = new Notificacion();
            notificacion.setUsuario(vendedor);
            notificacion.setVehiculo(venta.getVehiculo());
            notificacion.setVenta(venta);
            notificacion.setTipo(TIPO_SEGUIMIENTO_POSTVENTA);
            notificacion.setTitulo("Seguimiento postventa pendiente");
            notificacion.setMensaje("Contactá a " + nombreCliente(venta)
                    + " por la venta de " + nombreVehiculo(venta.getVehiculo()) + ".");
            notificacion.setLeida(false);
            notificacion.setUrlDestino("/app/ventas/" + venta.getId());
            this.notificacionRepository.save(notificacion);
        }
    }

    /** Genera recordatorios de mantenimiento próximos o vencidos para vendedor, dueño y administrador. */
    @Transactional
    public void generarProximosMantenimientos(LocalDate fechaLimite) {
        if (fechaLimite == null) {
            return;
        }

        List<Venta> ventas = this.ventaRepository
                .findByActivoTrueAndProximoMantenimientoIsNotNullAndProximoMantenimientoLessThanEqualOrderByProximoMantenimientoAsc(
                        fechaLimite);

        for (Venta venta : ventas) {
            Map<Long, Usuario> destinatarios = new LinkedHashMap<>();
            Usuario vendedor = venta.getVendedor();
            if (vendedor != null && Boolean.TRUE.equals(vendedor.getActivo())) {
                destinatarios.put(vendedor.getId(), vendedor);
            }
            for (Usuario usuario : this.usuarioRepository.buscarActivosPorRoles(List.of("ADMINISTRADOR", "DUENO"))) {
                destinatarios.put(usuario.getId(), usuario);
            }

            for (Usuario usuario : destinatarios.values()) {
                if (this.notificacionRepository.existsByUsuarioAndVentaAndTipoAndActivoTrue(
                        usuario, venta, TIPO_PROXIMO_MANTENIMIENTO)) {
                    continue;
                }
                Notificacion notificacion = new Notificacion();
                notificacion.setUsuario(usuario);
                notificacion.setVehiculo(venta.getVehiculo());
                notificacion.setVenta(venta);
                notificacion.setTipo(TIPO_PROXIMO_MANTENIMIENTO);
                notificacion.setTitulo("Próximo mantenimiento");
                notificacion.setMensaje(nombreVehiculo(venta.getVehiculo())
                        + " tiene mantenimiento previsto para " + venta.getProximoMantenimiento() + ".");
                notificacion.setLeida(false);
                notificacion.setUrlDestino("/app/ventas/" + venta.getId());
                this.notificacionRepository.save(notificacion);
            }
        }
    }

    /** Cierra el recordatorio anterior cuando la fecha se modifica o se elimina. */
    @Transactional
    public void cerrarProximoMantenimiento(Venta venta) {
        List<Notificacion> alertas = this.notificacionRepository
                .findByVentaAndTipoAndActivoTrue(venta, TIPO_PROXIMO_MANTENIMIENTO);
        if (alertas.isEmpty()) {
            return;
        }
        alertas.forEach(alerta -> {
            alerta.setLeida(true);
            alerta.setActivo(false);
        });
        this.notificacionRepository.saveAll(alertas);
    }

    /** Cierra cualquier recordatorio activo cuando el contacto postventa se confirma. */
    @Transactional
    public void cerrarSeguimientoPostventa(Venta venta) {
        List<Notificacion> alertas = this.notificacionRepository
                .findByVentaAndTipoAndActivoTrue(venta, TIPO_SEGUIMIENTO_POSTVENTA);
        if (alertas.isEmpty()) {
            return;
        }
        alertas.forEach(alerta -> {
            alerta.setLeida(true);
            alerta.setActivo(false);
        });
        this.notificacionRepository.saveAll(alertas);
    }

    private void desactivarAlertasListoRevision(Vehiculo vehiculo) {
        List<Notificacion> alertas = this.notificacionRepository
                .findByVehiculoAndTipoAndActivoTrue(vehiculo, TIPO_LISTO_REVISION);
        if (alertas.isEmpty()) {
            return;
        }
        alertas.forEach(alerta -> alerta.setActivo(false));
        this.notificacionRepository.saveAll(alertas);
    }

    private NotificacionResponse toResponse(Notificacion notificacion) {
        return new NotificacionResponse(
                notificacion.getId(),
                notificacion.getTipo(),
                notificacion.getTitulo(),
                notificacion.getMensaje(),
                notificacion.getVehiculo() == null ? null : notificacion.getVehiculo().getId(),
                notificacion.getVenta() == null ? null : notificacion.getVenta().getId(),
                notificacion.getLeida(),
                notificacion.getUrlDestino(),
                notificacion.getCreadoEn());
    }

    private String nombreVehiculo(Vehiculo vehiculo) {
        return (vehiculo.getMarca() + " " + vehiculo.getModelo() + " " + vehiculo.getAnio()).trim();
    }

    private String nombreCliente(Venta venta) {
        String apellido = venta.getClienteComprador().getApellido();
        return (venta.getClienteComprador().getNombre() + " " + (apellido == null ? "" : apellido)).trim();
    }
}
