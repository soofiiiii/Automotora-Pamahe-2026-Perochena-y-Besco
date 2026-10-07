package uy.edu.ctc.pamahe.modules.taller.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.Set;
import java.util.List;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import uy.edu.ctc.pamahe.common.exception.ResourceNotFoundException;
import uy.edu.ctc.pamahe.modules.taller.dto.request.RefaccionUpdateRequest;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.common.exception.IdempotencyConflictException;
import uy.edu.ctc.pamahe.modules.auditoria.service.AuditoriaService;
import uy.edu.ctc.pamahe.modules.compras.model.Compra;
import uy.edu.ctc.pamahe.modules.compras.repository.CompraRepository;
import uy.edu.ctc.pamahe.modules.notificaciones.service.NotificacionService;
import uy.edu.ctc.pamahe.modules.roles.model.Rol;
import uy.edu.ctc.pamahe.modules.taller.dto.request.RefaccionRequest;
import uy.edu.ctc.pamahe.modules.taller.idempotency.RefaccionOperacionOffline;
import uy.edu.ctc.pamahe.modules.taller.idempotency.RefaccionOperacionOfflineRepository;
import uy.edu.ctc.pamahe.modules.taller.model.EstadoTarea;
import uy.edu.ctc.pamahe.modules.taller.model.Refaccion;
import uy.edu.ctc.pamahe.modules.taller.model.TipoTrabajo;
import uy.edu.ctc.pamahe.modules.taller.repository.RefaccionRepository;
import uy.edu.ctc.pamahe.modules.usuarios.model.Usuario;
import uy.edu.ctc.pamahe.modules.usuarios.repository.UsuarioRepository;
import uy.edu.ctc.pamahe.modules.usuarios.service.UsuarioActualService;
import uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.service.VehiculoService;

@ExtendWith(MockitoExtension.class)
class RefaccionServiceTest {
    @Mock RefaccionRepository refaccionRepository;
    @Mock RefaccionOperacionOfflineRepository operacionOfflineRepository;
    @Mock VehiculoService vehiculoService;
    @Mock UsuarioRepository usuarioRepository;
    @Mock UsuarioActualService usuarioActualService;
    @Mock AuditoriaService auditoriaService;
    @Mock CompraRepository compraRepository;
    @Mock NotificacionService notificacionService;
    private RefaccionService service;

    @BeforeEach
    void setUp() {
        service = new RefaccionService(
                refaccionRepository, 
                operacionOfflineRepository,
                vehiculoService, 
                usuarioRepository, 
                usuarioActualService,
                auditoriaService, 
                compraRepository,
                notificacionService);
    }

    @Test
    void fechaNoPuedeSerAnteriorALaCompra() {
        Vehiculo v = vehiculo();
        Compra compra = new Compra();
        compra.setFechaCompra(LocalDate.of(2026, 8, 10));
        when(vehiculoService.buscarActivoPorIdConBloqueo(1L)).thenReturn(v);
        when(compraRepository.findByVehiculoAndActivoTrue(v)).thenReturn(Optional.of(compra));
        assertThrows(BusinessException.class, () -> service.crear(request(LocalDate.of(2026, 8, 9), null, null)));
    }

    @Test
    void reintentoOfflineLegacyEsIdempotente() {
        Vehiculo v = vehiculo();
        Usuario u = usuario("TALLER");
        Refaccion existente = refaccionExistente(v, u, "op-1", "Cambio de aceite");
        when(refaccionRepository.findByIdOperacionOffline("op-1")).thenReturn(Optional.of(existente));

        var result = service.crear(request(LocalDate.now(), null, "op-1"));

        assertEquals(55L, result.id());
        verify(operacionOfflineRepository, never()).reservarSiAusente(anyString(), anyString());
        verify(vehiculoService, never()).buscarActivoPorIdConBloqueo(anyLong());
        verify(refaccionRepository, never()).save(any());
    }

    @Test
    void mismaClaveOfflineConPayloadDistintoGeneraConflicto() {
        Vehiculo v = vehiculo();
        Usuario u = usuario("TALLER");
        Refaccion existente = refaccionExistente(v, u, "op-conflict", "Trabajo original");
        when(refaccionRepository.findByIdOperacionOffline("op-conflict")).thenReturn(Optional.of(existente));

        assertThrows(IdempotencyConflictException.class,
                () -> service.crear(request(LocalDate.now(), null, "op-conflict")));
        verify(refaccionRepository, never()).save(any());
    }

    @Test
    void reservaAtomicaDevuelveRefaccionYaCreadaPorOtroReintento() throws Exception {
        LocalDate fecha = LocalDate.now();
        RefaccionRequest request = request(fecha, null, "op-atomica");
        Vehiculo v = vehiculo();
        Usuario u = usuario("TALLER");
        Refaccion existente = refaccionExistente(v, u, "op-atomica", "Cambio de aceite");

        RefaccionOperacionOffline reserva = new RefaccionOperacionOffline();
        reserva.setIdOperacion("op-atomica");
        reserva.setRequestHash(hashRequest(request));
        reserva.setRefaccionId(55L);

        when(refaccionRepository.findByIdOperacionOffline("op-atomica")).thenReturn(Optional.empty());
        when(operacionOfflineRepository.bloquearPorId("op-atomica")).thenReturn(Optional.of(reserva));
        when(refaccionRepository.findByIdConBloqueoLectura(55L)).thenReturn(Optional.of(existente));

        var result = service.crear(request);

        assertEquals(55L, result.id());
        verify(vehiculoService, never()).buscarActivoPorIdConBloqueo(anyLong());
        verify(refaccionRepository, never()).save(any());
    }

    @Test
    void reservaConHashDistintoGeneraConflictoAntesDeCrear() {
        when(refaccionRepository.findByIdOperacionOffline("op-hash")).thenReturn(Optional.empty());
        RefaccionOperacionOffline reserva = new RefaccionOperacionOffline();
        reserva.setIdOperacion("op-hash");
        reserva.setRequestHash("hash-distinto");
        when(operacionOfflineRepository.bloquearPorId("op-hash")).thenReturn(Optional.of(reserva));

        assertThrows(IdempotencyConflictException.class,
                () -> service.crear(request(LocalDate.now(), null, "op-hash")));
        verify(vehiculoService, never()).buscarActivoPorIdConBloqueo(anyLong());
    }

    @Test
    void responsableVendedorNoEsValidoParaTaller() {
        Vehiculo v = vehiculo();
        Compra compra = new Compra();
        compra.setFechaCompra(LocalDate.now().minusDays(2));
        Usuario vendedor = usuario("VENDEDOR");
        vendedor.setId(3L);
        when(vehiculoService.buscarActivoPorIdConBloqueo(1L)).thenReturn(v);
        when(compraRepository.findByVehiculoAndActivoTrue(v)).thenReturn(Optional.of(compra));
        when(usuarioRepository.findById(3L)).thenReturn(Optional.of(vendedor));
        assertThrows(BusinessException.class, () -> service.crear(request(LocalDate.now(), 3L, null)));
    }

    @ParameterizedTest
    @EnumSource(value = EstadoVehiculo.class, names = {"VENDIDO", "DADO_DE_BAJA"})
    void vehiculosNoEditablesNoAcumulanNuevosCostos(EstadoVehiculo estado) {
        Vehiculo v = vehiculo();
        v.setEstado(estado);
        when(vehiculoService.buscarActivoPorIdConBloqueo(1L)).thenReturn(v);
        assertThrows(BusinessException.class, () -> service.crear(request(LocalDate.now(), null, null)));
        verify(refaccionRepository, never()).save(any());
        verifyNoInteractions(compraRepository, auditoriaService);
    }

    @Test
    void fechaAusenteOFuturaNoLlegaALaPersistencia() {
        when(vehiculoService.buscarActivoPorIdConBloqueo(1L)).thenReturn(vehiculo());
        assertThrows(BusinessException.class, () -> service.crear(request(null, null, null)));
        assertThrows(BusinessException.class, () -> service.crear(request(LocalDate.now().plusDays(1), null, null)));
        verify(refaccionRepository, never()).save(any());
        verifyNoInteractions(compraRepository);
    }

    @Test
    void refaccionSinCompraSeRechaza() {
        when(vehiculoService.buscarActivoPorIdConBloqueo(1L)).thenReturn(vehiculo());
        assertThrows(BusinessException.class, () -> service.crear(request(LocalDate.now(), null, null)));
        verify(refaccionRepository, never()).save(any());
    }

    @Test
    void responsableInexistenteOInactivoNoSeAcepta() {
        prepararVehiculoEditable(EstadoVehiculo.EN_TALLER);
        assertThrows(ResourceNotFoundException.class, () -> service.crear(request(LocalDate.now(), 3L, null)));
        Usuario u = usuario("TALLER");
        u.setActivo(false);
        when(usuarioRepository.findById(3L)).thenReturn(Optional.of(u));
        assertThrows(BusinessException.class, () -> service.crear(request(LocalDate.now(), 3L, null)));
        verify(refaccionRepository, never()).save(any());
    }

    @ParameterizedTest
    @EnumSource(value = EstadoVehiculo.class, names = {"COMPRADO", "DISPONIBLE", "EN_TALLER", "RESERVADO"})
    void tareaAbiertaEnviaATallerSoloCuandoCorresponde(EstadoVehiculo estado) {
        Vehiculo v = prepararVehiculoEditable(estado);
        Usuario u = usuario("TALLER");
        when(usuarioActualService.exigirRoles(any(String[].class))).thenReturn(u);
        when(refaccionRepository.save(any())).thenAnswer(inv -> {
            Refaccion r = inv.getArgument(0);
            r.setId(55L);
            return r;
        });
        var response = service.crear(request(LocalDate.now(), null, null));
        assertEquals(55L, response.id());
        assertEquals(new BigDecimal("11"), response.costoTotal());
        if (estado == EstadoVehiculo.EN_TALLER || estado == EstadoVehiculo.RESERVADO) {
            verify(vehiculoService, never()).cambiarEstadoPorSistema(any(), any(), any());
        } else {
            verify(vehiculoService).cambiarEstadoPorSistema(v, EstadoVehiculo.EN_TALLER,
                    "Ingreso automático a taller por la refacción 55");
        }
        verify(auditoriaService).registrar(org.mockito.ArgumentMatchers.eq("ALTA"),
                org.mockito.ArgumentMatchers.eq("Refaccion"), org.mockito.ArgumentMatchers.eq(55L),
                anyString(), org.mockito.ArgumentMatchers.isNull(), anyString());
    }

    @Test
    void cargaSinCostosNormalizaACeroYEstadoPendiente() {
        prepararVehiculoEditable(EstadoVehiculo.EN_TALLER);
        when(usuarioActualService.exigirRoles(any(String[].class))).thenReturn(usuario("TALLER"));
        when(refaccionRepository.save(any())).thenAnswer(inv -> {
            Refaccion r = inv.getArgument(0);
            r.setId(55L);
            return r;
        });
        var result = service.crear(new RefaccionRequest(1L, null, LocalDate.now(), TipoTrabajo.MECANICA,
                "  Revisión  ", null, null, null, null, " ", null, false, " "));
        assertEquals("Revisión", result.descripcion());
        assertEquals(BigDecimal.ZERO, result.costoTotal());
        assertEquals(EstadoTarea.PENDIENTE, result.estadoTarea());
        assertNull(result.observaciones());
        assertFalse(result.sincronizadoDesdeOffline());
        verifyNoInteractions(operacionOfflineRepository);
    }

    @Test
    void nuevaReservaOfflineSeAsociaAlIdPersistido() {
        prepararVehiculoEditable(EstadoVehiculo.EN_TALLER);
        when(usuarioActualService.exigirRoles(any(String[].class))).thenReturn(usuario("TALLER"));
        RefaccionOperacionOffline reserva = new RefaccionOperacionOffline();
        reserva.setIdOperacion("nueva-op");
        // El repositorio devuelve el hash reservado por el servicio, sin replicar su algoritmo.
        doAnswer(inv -> {
            reserva.setRequestHash(inv.getArgument(1));
            return 1;
        }).when(operacionOfflineRepository).reservarSiAusente(anyString(), anyString());
        when(operacionOfflineRepository.bloquearPorId("nueva-op")).thenReturn(Optional.of(reserva));
        when(refaccionRepository.save(any())).thenAnswer(inv -> {
            Refaccion r = inv.getArgument(0);
            r.setId(55L);
            return r;
        });
        var result = service.crear(request(LocalDate.now(), null, "nueva-op"));
        assertEquals(55L, result.id());
        assertTrue(result.sincronizadoDesdeOffline());
        assertEquals(55L, reserva.getRefaccionId());
        verify(operacionOfflineRepository).save(reserva);
    }

    @ParameterizedTest
    @EnumSource(value = EstadoTarea.class, names = {"FINALIZADA", "CANCELADA"})
    void finalizarOCancelarNoReasignaVehiculoNiLoPublica(EstadoTarea estado) {
        Vehiculo v = prepararVehiculoEditable(EstadoVehiculo.EN_TALLER);
        Usuario u = usuario("TALLER");
        Refaccion r = refaccionExistente(v, u, "op-original", "Cambio de aceite");
        when(refaccionRepository.findById(55L)).thenReturn(Optional.of(r));
        when(usuarioRepository.findById(8L)).thenReturn(Optional.of(u));
        when(refaccionRepository.save(r)).thenReturn(r);
        var result = service.actualizar(55L, new RefaccionUpdateRequest(8L, LocalDate.now(),
                TipoTrabajo.MECANICA, " Ajustado ", new BigDecimal("2.50"), new BigDecimal("3.25"),
                BigDecimal.ZERO, estado, " revisado ", null));
        assertEquals(1L, result.vehiculoId());
        assertEquals(new BigDecimal("5.75"), result.costoTotal());
        assertEquals(estado, result.estadoTarea());
        assertEquals("op-original", r.getIdOperacionOffline());
        assertSame(u, r.getUsuarioQueRegistra());
        verify(vehiculoService, never()).cambiarEstadoPorSistema(any(), any(), any());
        verify(notificacionService).reconciliarVehiculoListoParaRevision(v);
    }

    @Test
    void refaccionExistentePuedeEditarMientrasVehiculoEsteReservado() {
        Vehiculo v = prepararVehiculoEditable(EstadoVehiculo.RESERVADO);
        Usuario u = usuario("TALLER");
        Refaccion r = refaccionExistente(v, u, "op-original", "Cambio de aceite");
        r.setEstadoTarea(EstadoTarea.FINALIZADA);
        when(refaccionRepository.findById(55L)).thenReturn(Optional.of(r));
        when(refaccionRepository.save(r)).thenReturn(r);

        var result = service.actualizar(55L, new RefaccionUpdateRequest(null, LocalDate.now(),
                TipoTrabajo.MECANICA, "Corrección final", BigDecimal.ONE, BigDecimal.ONE,
                BigDecimal.ZERO, EstadoTarea.FINALIZADA, null, null));

        assertEquals("Corrección final", result.descripcion());
        assertEquals(EstadoTarea.FINALIZADA, result.estadoTarea());
    }

    @Test
    void actualizacionRechazaRefaccionAusenteOInactiva() {
        var request = new RefaccionUpdateRequest(null, LocalDate.now(), TipoTrabajo.MECANICA,
                "Revisión", BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, EstadoTarea.PENDIENTE, null, null);
        assertThrows(ResourceNotFoundException.class, () -> service.actualizar(55L, request));
        Refaccion r = new Refaccion();
        r.setActivo(false);
        when(refaccionRepository.findById(55L)).thenReturn(Optional.of(r));
        assertThrows(ResourceNotFoundException.class, () -> service.actualizar(55L, request));
        verifyNoInteractions(vehiculoService);
    }

    @Test
    void listadosMapeanDatosOperativos() {
        Vehiculo v = vehiculo();
        Refaccion r = refaccionExistente(v, usuario("TALLER"), null, "Cambio de aceite");
        when(refaccionRepository.findByActivoTrueOrderByFechaDesc()).thenReturn(List.of(r));
        when(refaccionRepository.findByEstadoTareaAndActivoTrueOrderByFechaAsc(EstadoTarea.PENDIENTE))
                .thenReturn(List.of(r));
        when(vehiculoService.buscarActivoPorId(1L)).thenReturn(v);
        when(refaccionRepository.findByVehiculoAndActivoTrueOrderByFechaDesc(v)).thenReturn(List.of(r));
        assertEquals(55L, service.listar().get(0).id());
        assertEquals(EstadoTarea.PENDIENTE, service.listarPorEstado(EstadoTarea.PENDIENTE).get(0).estadoTarea());
        assertEquals(1L, service.listarPorVehiculo(1L).get(0).vehiculoId());
    }

    private Vehiculo prepararVehiculoEditable(EstadoVehiculo estado) {
        Vehiculo v = vehiculo();
        v.setEstado(estado);
        Compra compra = new Compra();
        compra.setFechaCompra(LocalDate.now().minusDays(2));
        when(vehiculoService.buscarActivoPorIdConBloqueo(1L)).thenReturn(v);
        when(compraRepository.findByVehiculoAndActivoTrue(v)).thenReturn(Optional.of(compra));
        return v;
    }

    private String hashRequest(RefaccionRequest request) throws Exception {
        String canonical = String.join("|",
                String.valueOf(request.vehiculoId()),
                "<null>",
                String.valueOf(request.fecha()),
                String.valueOf(request.tipoTrabajo()),
                request.descripcion().trim(),
                request.costoRepuestos().stripTrailingZeros().toString(),
                request.costoManoObra().stripTrailingZeros().toString(),
                request.costoServiciosExternos().stripTrailingZeros().toString(),
                String.valueOf(request.estadoTarea()),
                "<null>",
                request.registroFotograficoUrl());
        var digest = java.security.MessageDigest.getInstance("SHA-256");
        return java.util.HexFormat.of().formatHex(digest.digest(canonical.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
    }

    private RefaccionRequest request(LocalDate fecha, Long responsable, String offline) {
        return new RefaccionRequest(1L, responsable, fecha, TipoTrabajo.MECANICA, "Cambio de aceite", BigDecimal.TEN,
                BigDecimal.ONE, BigDecimal.ZERO, EstadoTarea.PENDIENTE, null, "https://example.test/foto.jpg",
                offline != null, offline);
    }

    private Refaccion refaccionExistente(Vehiculo v, Usuario u, String idOperacion, String descripcion) {
        Refaccion existente = new Refaccion();
        existente.setId(55L);
        existente.setVehiculo(v);
        existente.setUsuarioQueRegistra(u);
        existente.setFecha(LocalDate.now());
        existente.setTipoTrabajo(TipoTrabajo.MECANICA);
        existente.setDescripcion(descripcion);
        existente.setCostoRepuestos(BigDecimal.TEN);
        existente.setCostoManoObra(BigDecimal.ONE);
        existente.setCostoServiciosExternos(BigDecimal.ZERO);
        existente.setEstadoTarea(EstadoTarea.PENDIENTE);
        existente.setRegistroFotograficoUrl("https://example.test/foto.jpg");
        existente.setSincronizadoDesdeOffline(true);
        existente.setIdOperacionOffline(idOperacion);
        return existente;
    }

    private Vehiculo vehiculo() {
        Vehiculo v = new Vehiculo();
        v.setId(1L);
        v.setEstado(EstadoVehiculo.EN_TALLER);
        return v;
    }

    private Usuario usuario(String role) {
        Usuario u = new Usuario();
        u.setId(8L);
        u.setNombre("Tester");
        Rol r = new Rol();
        r.setNombre(role);
        u.setRoles(Set.of(r));
        return u;
    }
}
