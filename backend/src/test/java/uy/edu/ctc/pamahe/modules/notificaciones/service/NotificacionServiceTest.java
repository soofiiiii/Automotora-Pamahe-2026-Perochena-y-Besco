package uy.edu.ctc.pamahe.modules.notificaciones.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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
import uy.edu.ctc.pamahe.modules.clientes.model.Cliente;

@ExtendWith(MockitoExtension.class)
class NotificacionServiceTest {

    @Mock NotificacionRepository notificacionRepository;
    @Mock UsuarioRepository usuarioRepository;
    @Mock RefaccionRepository refaccionRepository;
    @Mock VentaRepository ventaRepository;
    @Mock UsuarioActualService usuarioActualService;

    private NotificacionService service;

    @BeforeEach
    void setUp() {
        service = new NotificacionService(
                notificacionRepository,
                usuarioRepository,
                refaccionRepository,
                ventaRepository,
                usuarioActualService);
    }

    @Test
    void generaUnaAlertaPorDestinatarioCuandoTodasLasTareasFinalizaron() {
        Vehiculo vehiculo = vehiculo();
        Usuario dueno = usuario(1L, "Dueño");
        Usuario vendedor = usuario(2L, "Vendedor");
        when(refaccionRepository.existsByVehiculoAndActivoTrue(vehiculo)).thenReturn(true);
        when(refaccionRepository.existsByVehiculoAndActivoTrueAndEstadoTareaNot(vehiculo, EstadoTarea.FINALIZADA))
                .thenReturn(false);
        when(usuarioRepository.buscarActivosPorRoles(List.of("DUENO", "VENDEDOR")))
                .thenReturn(List.of(dueno, vendedor));
        when(notificacionRepository.existsByUsuarioAndVehiculoAndTipoAndActivoTrue(
                any(), any(), any())).thenReturn(false);
        when(notificacionRepository.save(any(Notificacion.class))).thenAnswer(inv -> inv.getArgument(0));

        service.reconciliarVehiculoListoParaRevision(vehiculo);

        verify(notificacionRepository, org.mockito.Mockito.times(2)).save(any(Notificacion.class));
    }

    @Test
    void noDuplicaLaAlertaSiYaExisteParaElMismoUsuarioYVehiculo() {
        Vehiculo vehiculo = vehiculo();
        Usuario dueno = usuario(1L, "Dueño");
        when(refaccionRepository.existsByVehiculoAndActivoTrue(vehiculo)).thenReturn(true);
        when(refaccionRepository.existsByVehiculoAndActivoTrueAndEstadoTareaNot(vehiculo, EstadoTarea.FINALIZADA))
                .thenReturn(false);
        when(usuarioRepository.buscarActivosPorRoles(List.of("DUENO", "VENDEDOR"))).thenReturn(List.of(dueno));
        when(notificacionRepository.existsByUsuarioAndVehiculoAndTipoAndActivoTrue(
                dueno, vehiculo, TipoNotificacion.VEHICULO_LISTO_REVISION)).thenReturn(true);

        service.reconciliarVehiculoListoParaRevision(vehiculo);

        verify(notificacionRepository, never()).save(any(Notificacion.class));
    }

    @Test
    void invalidaLaAlertaSiApareceUnaTareaNoFinalizada() {
        Vehiculo vehiculo = vehiculo();
        Notificacion alerta = new Notificacion();
        alerta.setActivo(true);
        when(refaccionRepository.existsByVehiculoAndActivoTrue(vehiculo)).thenReturn(true);
        when(refaccionRepository.existsByVehiculoAndActivoTrueAndEstadoTareaNot(vehiculo, EstadoTarea.FINALIZADA))
                .thenReturn(true);
        when(notificacionRepository.findByVehiculoAndTipoAndActivoTrue(
                vehiculo, TipoNotificacion.VEHICULO_LISTO_REVISION)).thenReturn(List.of(alerta));

        service.reconciliarVehiculoListoParaRevision(vehiculo);

        assertFalse(alerta.getActivo());
        verify(notificacionRepository).saveAll(List.of(alerta));
        verify(usuarioRepository, never()).buscarActivosPorRoles(any());
    }

    @Test
    void marcarLeidaSoloActualizaLaNotificacionDelUsuarioActual() {
        Usuario usuario = usuario(1L, "Vendedor");
        Notificacion alerta = new Notificacion();
        alerta.setId(7L);
        alerta.setUsuario(usuario);
        alerta.setTipo(TipoNotificacion.VEHICULO_LISTO_REVISION);
        alerta.setTitulo("Vehículo listo para revisión");
        alerta.setMensaje("Listo");
        alerta.setLeida(false);
        when(usuarioActualService.exigirRoles("ADMINISTRADOR", "DUENO", "VENDEDOR")).thenReturn(usuario);
        when(notificacionRepository.findByIdAndUsuarioAndActivoTrue(7L, usuario))
                .thenReturn(java.util.Optional.of(alerta));
        when(notificacionRepository.save(alerta)).thenReturn(alerta);

        service.marcarLeida(7L);

        assertTrue(alerta.getLeida());
    }

    @Test
    void generaRecordatorioPostventaAlVendedorSinDuplicarlo() {
        Vehiculo vehiculo = vehiculo();
        Usuario vendedor = usuario(3L, "Vendedor");
        vendedor.setActivo(true);
        Cliente cliente = new Cliente();
        cliente.setNombre("Ana");
        cliente.setApellido("Pérez");
        Venta venta = new Venta();
        venta.setId(30L);
        venta.setVehiculo(vehiculo);
        venta.setVendedor(vendedor);
        venta.setClienteComprador(cliente);
        when(ventaRepository.findByActivoTrueAndSeguimientoPostventaRealizadoFalseAndFechaVentaLessThanEqualOrderByFechaVentaAsc(any()))
                .thenReturn(List.of(venta));
        when(notificacionRepository.existsByUsuarioAndVentaAndTipoAndActivoTrue(
                vendedor, venta, TipoNotificacion.SEGUIMIENTO_POSTVENTA)).thenReturn(false);
        when(notificacionRepository.save(any(Notificacion.class))).thenAnswer(inv -> inv.getArgument(0));

        service.generarSeguimientosPostventaVencidos(LocalDate.now().minusDays(7));

        verify(notificacionRepository).save(org.mockito.ArgumentMatchers.argThat(n ->
                n.getVenta() == venta
                        && n.getVehiculo() == vehiculo
                        && n.getUsuario() == vendedor
                        && n.getTipo() == TipoNotificacion.SEGUIMIENTO_POSTVENTA));
    }

    @Test
    void generaRecordatorioDeProximoMantenimientoParaVendedorYAdministracion() {
        Vehiculo vehiculo = vehiculo();
        Usuario vendedor = usuario(3L, "Vendedor");
        vendedor.setActivo(true);
        Usuario dueno = usuario(4L, "Dueño");
        dueno.setActivo(true);
        Venta venta = new Venta();
        venta.setId(31L);
        venta.setVehiculo(vehiculo);
        venta.setVendedor(vendedor);
        venta.setProximoMantenimiento(LocalDate.now().plusDays(5));
        when(ventaRepository.findByActivoTrueAndProximoMantenimientoIsNotNullAndProximoMantenimientoLessThanEqualOrderByProximoMantenimientoAsc(any()))
                .thenReturn(List.of(venta));
        when(usuarioRepository.buscarActivosPorRoles(List.of("ADMINISTRADOR", "DUENO")))
                .thenReturn(List.of(dueno));
        when(notificacionRepository.existsByUsuarioAndVentaAndTipoAndActivoTrue(
                any(), any(), org.mockito.ArgumentMatchers.eq(TipoNotificacion.PROXIMO_MANTENIMIENTO)))
                .thenReturn(false);
        when(notificacionRepository.save(any(Notificacion.class))).thenAnswer(inv -> inv.getArgument(0));

        service.generarProximosMantenimientos(LocalDate.now().plusDays(7));

        verify(notificacionRepository, org.mockito.Mockito.times(2)).save(
                org.mockito.ArgumentMatchers.argThat(n -> n.getTipo() == TipoNotificacion.PROXIMO_MANTENIMIENTO));
    }

    @Test
    void cerrarSeguimientoPostventaDesactivaRecordatoriosActivos() {
        Venta venta = new Venta();
        Notificacion alerta = new Notificacion();
        alerta.setActivo(true);
        alerta.setLeida(false);
        when(notificacionRepository.findByVentaAndTipoAndActivoTrue(
                venta, TipoNotificacion.SEGUIMIENTO_POSTVENTA)).thenReturn(List.of(alerta));

        service.cerrarSeguimientoPostventa(venta);

        assertFalse(alerta.getActivo());
        assertTrue(alerta.getLeida());
        verify(notificacionRepository).saveAll(List.of(alerta));
    }

    private Vehiculo vehiculo() {
        Vehiculo vehiculo = new Vehiculo();
        vehiculo.setId(10L);
        vehiculo.setMarca("Toyota");
        vehiculo.setModelo("Corolla");
        vehiculo.setAnio(2020);
        return vehiculo;
    }

    private Usuario usuario(Long id, String nombre) {
        Usuario usuario = new Usuario();
        usuario.setId(id);
        usuario.setNombre(nombre);
        return usuario;
    }
}
