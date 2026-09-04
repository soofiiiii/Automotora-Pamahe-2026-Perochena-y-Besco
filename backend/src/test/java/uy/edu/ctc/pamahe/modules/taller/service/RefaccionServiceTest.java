package uy.edu.ctc.pamahe.modules.taller.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

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
import uy.edu.ctc.pamahe.modules.auditoria.service.AuditoriaService;
import uy.edu.ctc.pamahe.modules.compras.model.Compra;
import uy.edu.ctc.pamahe.modules.compras.repository.CompraRepository;
import uy.edu.ctc.pamahe.modules.roles.model.Rol;
import uy.edu.ctc.pamahe.modules.taller.dto.request.RefaccionRequest;
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
    @Mock
    RefaccionRepository refaccionRepository;
    @Mock
    VehiculoService vehiculoService;
    @Mock
    UsuarioRepository usuarioRepository;
    @Mock
    UsuarioActualService usuarioActualService;
    @Mock
    AuditoriaService auditoriaService;
    @Mock
    CompraRepository compraRepository;
    private RefaccionService service;

    @BeforeEach
    void setUp() {
        service = new RefaccionService(refaccionRepository, vehiculoService, usuarioRepository, usuarioActualService,
                auditoriaService, compraRepository);
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
    void reintentoOfflineEsIdempotente() {
        Vehiculo v = vehiculo();
        Usuario u = usuario("TALLER");
        Refaccion existente = new Refaccion();
        existente.setId(55L);
        existente.setVehiculo(v);
        existente.setUsuarioQueRegistra(u);
        existente.setFecha(LocalDate.now());
        existente.setTipoTrabajo(TipoTrabajo.MECANICA);
        existente.setDescripcion("Cambio");
        existente.setEstadoTarea(EstadoTarea.PENDIENTE);
        existente.setIdOperacionOffline("op-1");
        when(refaccionRepository.findByIdOperacionOffline("op-1")).thenReturn(Optional.of(existente));
        var result = service.crear(request(LocalDate.now(), null, "op-1"));
        assertEquals(55L, result.id());
        verify(vehiculoService, never()).buscarActivoPorIdConBloqueo(anyLong());
        verify(refaccionRepository, never()).save(any());
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

    private RefaccionRequest request(LocalDate fecha, Long responsable, String offline) {
        return new RefaccionRequest(1L, responsable, fecha, TipoTrabajo.MECANICA, "Cambio de aceite", BigDecimal.TEN,
                BigDecimal.ONE, BigDecimal.ZERO, EstadoTarea.PENDIENTE, null, "https://example.test/foto.jpg",
                offline != null, offline);
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
