package uy.edu.ctc.pamahe.modules.taller.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.Set;

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
                compraRepository);
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
