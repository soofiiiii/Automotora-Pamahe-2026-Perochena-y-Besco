package uy.edu.ctc.pamahe.modules.ventas.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.common.util.PdfService;
import uy.edu.ctc.pamahe.modules.auditoria.service.AuditoriaService;
import uy.edu.ctc.pamahe.modules.clientes.model.Cliente;
import uy.edu.ctc.pamahe.modules.clientes.model.TipoCliente;
import uy.edu.ctc.pamahe.modules.clientes.service.ClienteService;
import uy.edu.ctc.pamahe.modules.compras.model.Compra;
import uy.edu.ctc.pamahe.modules.compras.repository.CompraRepository;
import uy.edu.ctc.pamahe.modules.costos.service.CostoService;
import uy.edu.ctc.pamahe.modules.taller.repository.RefaccionRepository;
import uy.edu.ctc.pamahe.modules.usuarios.model.Usuario;
import uy.edu.ctc.pamahe.modules.usuarios.service.UsuarioActualService;
import uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.service.VehiculoService;
import uy.edu.ctc.pamahe.modules.ventas.dto.request.VentaRequest;
import uy.edu.ctc.pamahe.modules.ventas.model.Venta;
import uy.edu.ctc.pamahe.modules.ventas.repository.VentaRepository;

@ExtendWith(MockitoExtension.class)
class VentaServiceTest {
    @Mock
    VentaRepository ventaRepository;
    @Mock
    VehiculoService vehiculoService;
    @Mock
    ClienteService clienteService;
    @Mock
    UsuarioActualService usuarioActualService;
    @Mock
    CompraRepository compraRepository;
    @Mock
    RefaccionRepository refaccionRepository;
    @Mock
    CostoService costoService;
    @Mock
    PdfService pdfService;
    @Mock
    AuditoriaService auditoriaService;
    private VentaService service;

    @BeforeEach
    void setUp() {
        service = new VentaService(ventaRepository, vehiculoService, clienteService, usuarioActualService,
                compraRepository, refaccionRepository, costoService, pdfService, auditoriaService);
    }

    @Test
    void impideVentaDuplicada() {
        Vehiculo v = vehiculo();
        when(vehiculoService.buscarActivoPorIdConBloqueo(1L)).thenReturn(v);
        when(ventaRepository.existsByVehiculo(v)).thenReturn(true);
        assertThrows(BusinessException.class, () -> service.crear(request()));
    }

    @Test
    void impideVentaConTareasAbiertas() {
        Vehiculo v = vehiculo();
        when(vehiculoService.buscarActivoPorIdConBloqueo(1L)).thenReturn(v);
        when(ventaRepository.existsByVehiculo(v)).thenReturn(false);
        when(refaccionRepository.existsByVehiculoAndActivoTrueAndEstadoTareaIn(eq(v), anyCollection()))
                .thenReturn(true);
        assertThrows(BusinessException.class, () -> service.crear(request()));
    }

    @Test
    void guardaSnapshotYRentaAlVender() {
        Vehiculo v = vehiculo();
        Usuario user = new Usuario();
        user.setId(7L);
        user.setNombre("Vendedor");
        Cliente cliente = new Cliente();
        cliente.setId(2L);
        cliente.setNombre("Ana");
        cliente.setDocumento("123");
        cliente.setTipoCliente(TipoCliente.COMPRADOR);
        Compra compra = new Compra();
        compra.setFechaCompra(LocalDate.now().minusDays(10));
        when(usuarioActualService.exigirRoles(any(String[].class))).thenReturn(user);
        when(vehiculoService.buscarActivoPorIdConBloqueo(1L)).thenReturn(v);
        when(compraRepository.findByVehiculoAndActivoTrue(v)).thenReturn(Optional.of(compra));
        when(clienteService.buscarActivoPorId(2L)).thenReturn(cliente);
        when(costoService.calcularActualParaVenta(v)).thenReturn(new CostoService.CostoSnapshot(new BigDecimal("10000"),
                new BigDecimal("2000"), new BigDecimal("12000")));
        when(ventaRepository.save(any(Venta.class))).thenAnswer(inv -> {
            Venta venta = inv.getArgument(0);
            if (venta.getId() == null)
                venta.setId(9L);
            return venta;
        });
        when(pdfService.generarComprobante(anyString(), anyList())).thenReturn("ventas/9.pdf");

        service.crear(request());

        verify(ventaRepository, atLeastOnce())
                .save(argThat(venta -> new BigDecimal("12000").equals(venta.getCostoTotalAlVender())
                        && new BigDecimal("3000").equals(venta.getRentabilidadCalculada())));
        verify(vehiculoService).marcarVendidoPorVenta(v, 9L);
    }

    private Vehiculo vehiculo() {
        Vehiculo v = new Vehiculo();
        v.setId(1L);
        v.setMarca("Toyota");
        v.setModelo("Corolla");
        v.setAnio(2020);
        v.setEstado(EstadoVehiculo.DISPONIBLE);
        return v;
    }

    private VentaRequest request() {
        return new VentaRequest(1L, 2L, LocalDate.now(), new BigDecimal("15000"), null);
    }
}
