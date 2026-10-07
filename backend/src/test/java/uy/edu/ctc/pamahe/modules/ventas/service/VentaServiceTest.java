package uy.edu.ctc.pamahe.modules.ventas.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.List;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.security.access.AccessDeniedException;
import uy.edu.ctc.pamahe.common.exception.ResourceNotFoundException;
import org.springframework.context.ApplicationEventPublisher;

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
import uy.edu.ctc.pamahe.modules.notificaciones.service.NotificacionService;
import uy.edu.ctc.pamahe.modules.usuarios.model.Usuario;
import uy.edu.ctc.pamahe.modules.usuarios.service.UsuarioActualService;
import uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.service.VehiculoService;
import uy.edu.ctc.pamahe.modules.ventas.dto.request.VentaRequest;
import uy.edu.ctc.pamahe.modules.ventas.dto.request.ActualizarProximoMantenimientoRequest;
import uy.edu.ctc.pamahe.modules.ventas.model.EstadoComprobanteVenta;
import uy.edu.ctc.pamahe.modules.ventas.model.CanalOrigenVenta;
import uy.edu.ctc.pamahe.modules.ventas.model.EstadoFinanciacion;
import uy.edu.ctc.pamahe.modules.ventas.model.MedioPagoVenta;
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
    @Mock
    VentaComprobanteService ventaComprobanteService;
    @Mock
    NotificacionService notificacionService;
    @Mock
    ApplicationEventPublisher eventPublisher;
    private VentaService service;

    @BeforeEach
    void setUp() {
        service = new VentaService(
                ventaRepository,
                vehiculoService,
                clienteService,
                usuarioActualService,
                compraRepository,
                refaccionRepository,
                costoService,
                pdfService,
                auditoriaService,
                ventaComprobanteService,
                notificacionService,
                eventPublisher);
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
        when(costoService.calcularActualParaVenta(v, compra)).thenReturn(new CostoService.CostoSnapshot(new BigDecimal("10000"),
                new BigDecimal("2000"), new BigDecimal("12000")));
        when(ventaRepository.save(any(Venta.class))).thenAnswer(inv -> {
            Venta venta = inv.getArgument(0);
            if (venta.getId() == null)
                venta.setId(9L);
            return venta;
        });

        service.crear(request());

        verify(ventaRepository, atLeastOnce())
                .save(argThat(venta -> new BigDecimal("12000").equals(venta.getCostoTotalAlVender())
                        && new BigDecimal("3000").equals(venta.getRentabilidadCalculada())
                        && venta.getVendedor() == user));
        verify(usuarioActualService).exigirRoles("ADMINISTRADOR", "DUENO", "VENDEDOR");
        verify(vehiculoService).marcarVendidoPorVenta(v, 9L);
    }

    @ParameterizedTest
    @EnumSource(value = EstadoVehiculo.class, names = { "DISPONIBLE" }, mode = EnumSource.Mode.EXCLUDE)
    void estadoIncompatibleNoGeneraVenta(EstadoVehiculo estado) {
        Vehiculo v = vehiculo();
        v.setEstado(estado);
        when(vehiculoService.buscarActivoPorIdConBloqueo(1L)).thenReturn(v);
        assertThrows(BusinessException.class, () -> service.crear(request()));
        verify(ventaRepository, never()).save(any());
        verifyNoInteractions(costoService, pdfService, auditoriaService);
    }

    @Test
    void reservadoNoPuedeVenderseHastaVolverADisponible() {
        Vehiculo v = vehiculo();
        v.setEstado(EstadoVehiculo.RESERVADO);
        when(vehiculoService.buscarActivoPorIdConBloqueo(1L)).thenReturn(v);

        assertThrows(BusinessException.class, () -> service.crear(request()));

        verify(ventaRepository, never()).save(any());
        verify(vehiculoService, never()).marcarVendidoPorVenta(any(), anyLong());
    }

    @Test
    void fechaFuturaSeRechazaAntesDelCalculo() {
        when(vehiculoService.buscarActivoPorIdConBloqueo(1L)).thenReturn(vehiculo());
        assertThrows(BusinessException.class, () -> service.crear(
                new VentaRequest(1L, 2L, LocalDate.now().plusDays(1), BigDecimal.TEN, MedioPagoVenta.TRANSFERENCIA, null, null, null, CanalOrigenVenta.PRESENCIAL, true, true, true, null, null)));
        verifyNoInteractions(costoService, pdfService, compraRepository);
    }

    @ParameterizedTest
    @ValueSource(strings = { "0", "-0.01" })
    void precioNoPositivoNoGeneraVenta(String precio) {
        when(vehiculoService.buscarActivoPorIdConBloqueo(1L)).thenReturn(vehiculo());
        assertThrows(BusinessException.class, () -> service.crear(
                new VentaRequest(1L, 2L, LocalDate.now(), new BigDecimal(precio), MedioPagoVenta.TRANSFERENCIA, null, null, null, CanalOrigenVenta.PRESENCIAL, true, true, true, null, null)));
        verify(ventaRepository, never()).save(any());
    }

    @Test
    void sinCompraNoSePuedeVender() {
        when(vehiculoService.buscarActivoPorIdConBloqueo(1L)).thenReturn(vehiculo());
        assertThrows(BusinessException.class, () -> service.crear(request()));
        verifyNoInteractions(clienteService, costoService, pdfService);
    }

    @Test
    void ventaNoPuedePrecederLaCompra() {
        Vehiculo v = vehiculo();
        Compra compra = new Compra();
        compra.setFechaCompra(LocalDate.now());
        when(vehiculoService.buscarActivoPorIdConBloqueo(1L)).thenReturn(v);
        when(compraRepository.findByVehiculoAndActivoTrue(v)).thenReturn(Optional.of(compra));
        assertThrows(BusinessException.class, () -> service.crear(
                new VentaRequest(1L, 2L, LocalDate.now().minusDays(1), BigDecimal.TEN, MedioPagoVenta.TRANSFERENCIA, null, null, null, CanalOrigenVenta.PRESENCIAL, true, true, true, null, null)));
        verifyNoInteractions(clienteService, costoService, pdfService);
    }

    @Test
    void clienteSoloVendedorNoPuedeComprar() {
        Vehiculo v = vehiculo();
        Compra compra = new Compra();
        compra.setFechaCompra(LocalDate.now());
        Cliente c = new Cliente();
        c.setTipoCliente(TipoCliente.VENDEDOR);
        when(vehiculoService.buscarActivoPorIdConBloqueo(1L)).thenReturn(v);
        when(compraRepository.findByVehiculoAndActivoTrue(v)).thenReturn(Optional.of(compra));
        when(clienteService.buscarActivoPorId(2L)).thenReturn(c);
        assertThrows(BusinessException.class, () -> service.crear(request()));
        verifyNoInteractions(costoService, pdfService);
    }

    @ParameterizedTest
    @ValueSource(strings = { "11000.25", "12000.00", "15000.99" })
    void snapshotConservaCentavosGananciaNulaYPerdida(String precio) {
        Venta preparada = prepararVenta();
        BigDecimal importe = new BigDecimal(precio);
        service.crear(new VentaRequest(1L, 2L, LocalDate.now(), importe, MedioPagoVenta.TRANSFERENCIA, null, null, null, CanalOrigenVenta.PRESENCIAL, true, true, true, null, null));
        var captor = org.mockito.ArgumentCaptor.forClass(Venta.class);
        verify(ventaRepository).save(captor.capture());
        Venta venta = captor.getValue();
        assertEquals(new BigDecimal("10000.00"), venta.getCostoCompraAlVender());
        assertEquals(new BigDecimal("2000.00"), venta.getCostoRefaccionesAlVender());
        assertEquals(new BigDecimal("12000.00"), venta.getCostoTotalAlVender());
        assertEquals(importe.subtract(new BigDecimal("12000.00")), venta.getRentabilidadCalculada());
        assertNull(venta.getComprobantePath());
        assertEquals(EstadoComprobanteVenta.PENDIENTE, venta.getEstadoComprobante());
        assertEquals(0, venta.getIntentosComprobante());
        assertNotNull(venta.getProximoIntentoComprobante());
        verifyNoInteractions(pdfService);
        verify(eventPublisher).publishEvent(any(uy.edu.ctc.pamahe.modules.ventas.event.VentaComprobanteSolicitadoEvent.class));
        verify(vehiculoService).marcarVendidoPorVenta(preparada.getVehiculo(), 9L);
    }

    @Test
    void falloAntesDelCommitPropagaErrorSinGenerarPdf() {
        prepararVenta();
        doThrow(new BusinessException("No se pudo registrar evento"))
                .when(eventPublisher).publishEvent(any(uy.edu.ctc.pamahe.modules.ventas.event.VentaComprobanteSolicitadoEvent.class));
        assertThrows(BusinessException.class, () -> service.crear(request()));
        verify(ventaRepository).save(any());
        verifyNoInteractions(pdfService);
    }

    @Test
    void reintentoManualReprogramaEstadoDurableYPublicaEventoPostCommit() {
        Venta venta = ventaCompleta();
        when(ventaRepository.findById(9L)).thenReturn(Optional.of(venta));

        service.reintentarComprobante(9L);

        verify(usuarioActualService).exigirRoles("ADMINISTRADOR", "DUENO");
        verify(ventaComprobanteService).reprogramar(9L);
        verify(eventPublisher).publishEvent(any(uy.edu.ctc.pamahe.modules.ventas.event.VentaComprobanteSolicitadoEvent.class));
    }

    @Test
    void consultasListanDatosYDetalleGerencialAutoriza() {
        Venta v = ventaCompleta();
        when(ventaRepository.findById(9L)).thenReturn(Optional.of(v));
        when(ventaRepository.findByActivoTrueOrderByFechaVentaDesc()).thenReturn(List.of(v));
        assertEquals(9L, service.obtener(9L).id());
        assertEquals(9L, service.listar().get(0).id());
        assertEquals(new BigDecimal("12000.00"), service.obtenerDetalleGerencial(9L).costoTotalAlVender());
        verify(usuarioActualService).exigirRoles("ADMINISTRADOR", "DUENO");
    }

    @Test
    void detalleGerencialNoExponeDatosSinPermiso() {
        when(usuarioActualService.exigirRoles("ADMINISTRADOR", "DUENO"))
                .thenThrow(new AccessDeniedException("Solo gerencia"));
        assertThrows(AccessDeniedException.class, () -> service.obtenerDetalleGerencial(9L));
        verifyNoInteractions(ventaRepository);
    }

    @Test
    void ventaInexistenteOInactivaNoTieneDetalleNiComprobante() {
        assertThrows(ResourceNotFoundException.class, () -> service.obtener(9L));
        assertThrows(ResourceNotFoundException.class, () -> service.obtenerComprobante(9L));
        Venta venta = new Venta();
        venta.setActivo(false);
        when(ventaRepository.findById(9L)).thenReturn(Optional.of(venta));
        assertThrows(ResourceNotFoundException.class, () -> service.obtener(9L));
        assertThrows(ResourceNotFoundException.class, () -> service.obtenerComprobante(9L));
        verifyNoInteractions(pdfService);
    }

    @Test
    void archivoDeComprobanteInexistentePropaga404() {
        Venta venta = ventaCompleta();
        venta.setComprobantePath("ausente.pdf");
        when(ventaRepository.findById(9L)).thenReturn(Optional.of(venta));
        when(pdfService.cargarComprobante("ausente.pdf")).thenThrow(new ResourceNotFoundException("Ausente"));
        assertThrows(ResourceNotFoundException.class, () -> service.obtenerComprobante(9L));
    }

    private Venta prepararVenta() {
        Venta venta = ventaCompleta();
        venta.getVehiculo().setEstado(EstadoVehiculo.DISPONIBLE);
        venta.getClienteComprador().setTipoCliente(TipoCliente.AMBOS);
        Compra compra = new Compra();
        compra.setFechaCompra(LocalDate.now());
        when(usuarioActualService.exigirRoles(any(String[].class))).thenReturn(venta.getVendedor());
        when(vehiculoService.buscarActivoPorIdConBloqueo(1L)).thenReturn(venta.getVehiculo());
        when(compraRepository.findByVehiculoAndActivoTrue(venta.getVehiculo())).thenReturn(Optional.of(compra));
        when(clienteService.buscarActivoPorId(2L)).thenReturn(venta.getClienteComprador());
        when(costoService.calcularActualParaVenta(venta.getVehiculo(), compra)).thenReturn(new CostoService.CostoSnapshot(
                new BigDecimal("10000.00"), new BigDecimal("2000.00"), new BigDecimal("12000.00")));
        when(ventaRepository.save(any(Venta.class))).thenAnswer(inv -> {
            Venta creada = inv.getArgument(0);
            creada.setId(9L);
            return creada;
        });
        return venta;
    }

    private Venta ventaCompleta() {
        Venta venta = new Venta();
        venta.setId(9L);
        venta.setVehiculo(vehiculo());
        Usuario user = new Usuario();
        user.setId(7L);
        user.setNombre("Vendedor");
        Cliente cliente = new Cliente();
        cliente.setId(2L);
        cliente.setNombre("Ana");
        cliente.setApellido("Pérez");
        cliente.setDocumento("123");
        cliente.setTipoCliente(TipoCliente.COMPRADOR);
        venta.setVendedor(user);
        venta.setClienteComprador(cliente);
        venta.setFechaVenta(LocalDate.now());
        venta.setCostoCompraAlVender(new BigDecimal("10000.00"));
        venta.setCostoRefaccionesAlVender(new BigDecimal("2000.00"));
        venta.setCostoTotalAlVender(new BigDecimal("12000.00"));
        venta.setPrecioFinal(new BigDecimal("15000.00"));
        venta.setRentabilidadCalculada(new BigDecimal("3000.00"));
        return venta;
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

    @Test
    void checklistIncompletoImpideCerrarVenta() {
        when(vehiculoService.buscarActivoPorIdConBloqueo(1L)).thenReturn(vehiculo());
        VentaRequest incompleta = new VentaRequest(
                1L, 2L, LocalDate.now(), new BigDecimal("15000"),
                MedioPagoVenta.TRANSFERENCIA, null, null, null, CanalOrigenVenta.PRESENCIAL,
                true, false, true, null, null);

        assertThrows(BusinessException.class, () -> service.crear(incompleta));
        verify(ventaRepository, never()).save(any());
        verifyNoInteractions(costoService);
    }

    @Test
    void checklistCompletoYProximoMantenimientoQuedanPersistidos() {
        prepararVenta();
        LocalDate mantenimiento = LocalDate.now().plusMonths(6);
        VentaRequest request = new VentaRequest(
                1L, 2L, LocalDate.now(), new BigDecimal("15000"),
                MedioPagoVenta.TRANSFERENCIA, null, null, null, CanalOrigenVenta.REFERIDO,
                true, true, true, mantenimiento, null);

        service.crear(request);

        var captor = org.mockito.ArgumentCaptor.forClass(Venta.class);
        verify(ventaRepository).save(captor.capture());
        Venta venta = captor.getValue();
        assertTrue(venta.getDatosCompradorVerificados());
        assertTrue(venta.getDocumentacionRevisada());
        assertTrue(venta.getCobroConfirmado());
        assertEquals(mantenimiento, venta.getProximoMantenimiento());
    }

    @Test
    void actualizarProximoMantenimientoCierraRecordatorioAnterior() {
        Usuario usuario = new Usuario();
        usuario.setUsername("vendedor");
        Venta venta = ventaCompleta();
        venta.setActivo(true);
        venta.setProximoMantenimiento(LocalDate.now().plusMonths(2));
        LocalDate nueva = LocalDate.now().plusMonths(4);
        when(usuarioActualService.exigirRoles("ADMINISTRADOR", "DUENO", "VENDEDOR")).thenReturn(usuario);
        when(ventaRepository.findById(9L)).thenReturn(Optional.of(venta));
        when(ventaRepository.save(venta)).thenReturn(venta);

        service.actualizarProximoMantenimiento(9L, new ActualizarProximoMantenimientoRequest(nueva));

        assertEquals(nueva, venta.getProximoMantenimiento());
        verify(notificacionService).cerrarProximoMantenimiento(venta);
    }

    @Test
    void ventaFinanciadaGuardaDatosBasicosDeFinanciacionYCanal() {
        prepararVenta();
        VentaRequest request = new VentaRequest(
                1L, 2L, LocalDate.now(), new BigDecimal("15000"),
                MedioPagoVenta.FINANCIACION_BANCARIA, "BROU",
                new BigDecimal("9000"), EstadoFinanciacion.PENDIENTE,
                CanalOrigenVenta.WHATSAPP, true, true, true, null, null);

        service.crear(request);

        var captor = org.mockito.ArgumentCaptor.forClass(Venta.class);
        verify(ventaRepository).save(captor.capture());
        Venta venta = captor.getValue();
        assertEquals(MedioPagoVenta.FINANCIACION_BANCARIA, venta.getMedioPago());
        assertEquals("BROU", venta.getEntidadFinanciera());
        assertEquals(new BigDecimal("9000"), venta.getMontoFinanciado());
        assertEquals(EstadoFinanciacion.PENDIENTE, venta.getEstadoFinanciacion());
        assertEquals(CanalOrigenVenta.WHATSAPP, venta.getCanalOrigen());
        assertFalse(venta.getSeguimientoPostventaRealizado());
    }

    @Test
    void ventaNoFinanciadaRechazaDatosDeFinanciacion() {
        when(vehiculoService.buscarActivoPorIdConBloqueo(1L)).thenReturn(vehiculo());
        VentaRequest request = new VentaRequest(
                1L, 2L, LocalDate.now(), new BigDecimal("15000"),
                MedioPagoVenta.EFECTIVO, "Entidad inválida", new BigDecimal("100"),
                EstadoFinanciacion.PENDIENTE, CanalOrigenVenta.PRESENCIAL, true, true, true, null, null);

        assertThrows(BusinessException.class, () -> service.crear(request));
        verify(ventaRepository, never()).save(any());
    }

    @Test
    void marcarSeguimientoPostventaActualizaVentaYCierraNotificacion() {
        Usuario usuario = new Usuario();
        usuario.setUsername("vendedor");
        Venta venta = new Venta();
        venta.setId(9L);
        venta.setSeguimientoPostventaRealizado(false);
        venta.setActivo(true);
        when(usuarioActualService.exigirRoles("ADMINISTRADOR", "DUENO", "VENDEDOR")).thenReturn(usuario);
        when(ventaRepository.findById(9L)).thenReturn(Optional.of(venta));
        when(ventaRepository.save(venta)).thenReturn(venta);

        venta.setVehiculo(vehiculo());
        Cliente cliente = new Cliente();
        cliente.setId(2L);
        cliente.setNombre("Ana");
        venta.setClienteComprador(cliente);
        Usuario vendedor = new Usuario();
        vendedor.setId(7L);
        vendedor.setNombre("Vendedor");
        venta.setVendedor(vendedor);

        service.marcarSeguimientoPostventaRealizado(9L);

        assertTrue(venta.getSeguimientoPostventaRealizado());
        verify(notificacionService).cerrarSeguimientoPostventa(venta);
    }

    private VentaRequest request() {
        return new VentaRequest(1L, 2L, LocalDate.now(), new BigDecimal("15000"), MedioPagoVenta.TRANSFERENCIA, null, null, null, CanalOrigenVenta.PRESENCIAL, true, true, true, null, null);
    }
}
