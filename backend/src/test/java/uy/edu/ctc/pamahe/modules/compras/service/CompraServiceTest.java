package uy.edu.ctc.pamahe.modules.compras.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import uy.edu.ctc.pamahe.common.exception.ResourceNotFoundException;
import uy.edu.ctc.pamahe.modules.compras.dto.response.CompraResponse;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.common.util.PdfService;
import uy.edu.ctc.pamahe.modules.auditoria.service.AuditoriaService;
import uy.edu.ctc.pamahe.modules.clientes.model.Cliente;
import uy.edu.ctc.pamahe.modules.clientes.model.TipoCliente;
import uy.edu.ctc.pamahe.modules.clientes.service.ClienteService;
import uy.edu.ctc.pamahe.modules.compras.dto.request.CompraRequest;
import uy.edu.ctc.pamahe.modules.compras.dto.request.CompraConVehiculoRequest;
import uy.edu.ctc.pamahe.modules.compras.dto.request.DefinirDestinoPostCompraRequest;
import uy.edu.ctc.pamahe.modules.compras.dto.request.DestinoPostCompra;
import uy.edu.ctc.pamahe.modules.compras.dto.response.CompraRegistroResponse;
import uy.edu.ctc.pamahe.modules.compras.model.Compra;
import uy.edu.ctc.pamahe.modules.compras.repository.CompraRepository;
import uy.edu.ctc.pamahe.modules.usuarios.model.Usuario;
import uy.edu.ctc.pamahe.modules.usuarios.service.UsuarioActualService;
import uy.edu.ctc.pamahe.modules.vehiculos.dto.request.VehiculoRequest;
import uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.model.UbicacionVehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.repository.VehiculoRepository;
import uy.edu.ctc.pamahe.modules.vehiculos.service.VehiculoService;

@ExtendWith(MockitoExtension.class)
class CompraServiceTest {
    @Mock
    CompraRepository compraRepository;
    @Mock
    VehiculoService vehiculoService;
    @Mock
    VehiculoRepository vehiculoRepository;
    @Mock
    ClienteService clienteService;
    @Mock
    UsuarioActualService usuarioActualService;
    @Mock
    PdfService pdfService;
    @Mock
    AuditoriaService auditoriaService;
    @InjectMocks
    CompraService service;

    @AfterEach
    void cleanSecurity() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void altaUnificadaAsociaLaCompraAlVehiculoCreadoPorElServidor() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                "gerente", "n/a", List.of(new SimpleGrantedAuthority("ROLE_DUENO"))));

        Usuario usuario = new Usuario();
        usuario.setId(7L);
        usuario.setNombre("Gerente");
        Vehiculo vehiculo = new Vehiculo();
        vehiculo.setId(44L);
        vehiculo.setMarca("Toyota");
        vehiculo.setModelo("Corolla");
        vehiculo.setAnio(2020);
        vehiculo.setEstado(EstadoVehiculo.COMPRADO);
        Cliente cliente = new Cliente();
        cliente.setId(2L);
        cliente.setNombre("Ana");
        cliente.setDocumento("123");
        cliente.setTipoCliente(TipoCliente.VENDEDOR);
        VehiculoRequest vehiculoRequest = new VehiculoRequest(
                "Toyota", "Corolla", "AUTO", 2020, "ABC1234", null, "Blanco", 80000,
                UbicacionVehiculo.LOCAL, null, null, null);
        CompraConVehiculoRequest request = new CompraConVehiculoRequest(
                vehiculoRequest, 2L, LocalDate.now(), new BigDecimal("10000"), null);

        when(usuarioActualService.exigirRoles(any(String[].class))).thenReturn(usuario);
        when(vehiculoService.crearParaCompra(vehiculoRequest)).thenReturn(vehiculo);
        when(vehiculoService.buscarActivoPorIdConBloqueo(44L)).thenReturn(vehiculo);
        when(clienteService.buscarActivoPorId(2L)).thenReturn(cliente);
        when(compraRepository.save(any(Compra.class))).thenAnswer(inv -> {
            Compra compra = inv.getArgument(0);
            if (compra.getId() == null) compra.setId(10L);
            return compra;
        });
        when(pdfService.generarComprobante(eq("COMPRA"), anyList())).thenReturn("compra.pdf");

        var result = assertInstanceOf(CompraResponse.class, service.crearConVehiculo(request));

        assertEquals(44L, result.vehiculoId());
        verify(vehiculoService).buscarActivoPorIdConBloqueo(44L);
        verify(vehiculoService, never()).buscarActivoPorIdConBloqueo(1L);
    }

    @Test
    void impideCompraDuplicada() {
        Vehiculo v = new Vehiculo();
        v.setId(1L);
        v.setEstado(EstadoVehiculo.COMPRADO);
        when(vehiculoService.buscarActivoPorIdConBloqueo(1L)).thenReturn(v);
        when(compraRepository.existsByVehiculo(v)).thenReturn(true);
        CompraRequest request = new CompraRequest(1L, 2L, LocalDate.now(), new BigDecimal("10000"), null);
        assertThrows(BusinessException.class, () -> service.crear(request));
        verifyNoInteractions(clienteService);
    }

    @Test
    void vendedorNoRecibeCostoNiComprobanteEnLaRespuestaDeAlta() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                "vendedor", "n/a", java.util.List.of(new SimpleGrantedAuthority("ROLE_VENDEDOR"))));
        Usuario usuario = new Usuario();
        usuario.setId(7L);
        usuario.setNombre("Vendedor");
        Vehiculo v = new Vehiculo();
        v.setId(1L);
        v.setMarca("Toyota");
        v.setModelo("Corolla");
        v.setAnio(2020);
        v.setEstado(EstadoVehiculo.COMPRADO);
        Cliente cliente = new Cliente();
        cliente.setId(2L);
        cliente.setNombre("Juan");
        cliente.setDocumento("123");
        cliente.setTipoCliente(TipoCliente.VENDEDOR);
        when(usuarioActualService.exigirRoles(any(String[].class))).thenReturn(usuario);
        when(vehiculoService.buscarActivoPorIdConBloqueo(1L)).thenReturn(v);
        when(compraRepository.existsByVehiculo(v)).thenReturn(false);
        when(clienteService.buscarActivoPorId(2L)).thenReturn(cliente);
        when(compraRepository.save(any(Compra.class))).thenAnswer(inv -> {
            Compra c = inv.getArgument(0);
            if (c.getId() == null)
                c.setId(10L);
            return c;
        });
        when(pdfService.generarComprobante(anyString(), anyList())).thenReturn("compras/10.pdf");
        Object result = service.crear(new CompraRequest(1L, 2L, LocalDate.now(), new BigDecimal("10000"), null));
        assertInstanceOf(CompraRegistroResponse.class, result);
    }


    @ParameterizedTest
    @EnumSource(value = EstadoVehiculo.class, names = "COMPRADO", mode = EnumSource.Mode.EXCLUDE)
    void compraRechazaEstadosPosterioresAlIngreso(EstadoVehiculo estado) {
        Vehiculo v = new Vehiculo();
        v.setEstado(estado);
        when(vehiculoService.buscarActivoPorIdConBloqueo(1L)).thenReturn(v);
        assertThrows(BusinessException.class, () -> service.crear(solicitud(LocalDate.now())));
        verify(compraRepository, never()).save(any());
        verifyNoInteractions(clienteService, pdfService, auditoriaService);
    }

    @Test
    void compraFuturaNoPersiste() {
        when(vehiculoService.buscarActivoPorIdConBloqueo(1L)).thenReturn(new Vehiculo());
        assertThrows(BusinessException.class, () -> service.crear(solicitud(LocalDate.now().plusDays(1))));
        verify(compraRepository, never()).save(any());
        verifyNoInteractions(clienteService, pdfService);
    }

    @Test
    void compradorNoPuedeActuarComoVendedor() {
        when(vehiculoService.buscarActivoPorIdConBloqueo(1L)).thenReturn(new Vehiculo());
        Cliente c = new Cliente();
        c.setTipoCliente(TipoCliente.COMPRADOR);
        when(clienteService.buscarActivoPorId(2L)).thenReturn(c);
        assertThrows(BusinessException.class, () -> service.crear(solicitud(LocalDate.now())));
        verify(compraRepository, never()).save(any());
    }

    @Test
    void rolNoAutorizadoSeRechazaAntesDeAccederADatos() {
        when(usuarioActualService.exigirRoles(any(String[].class)))
                .thenThrow(new AccessDeniedException("Sin permiso"));
        assertThrows(AccessDeniedException.class, () -> service.crear(solicitud(LocalDate.now())));
        verifyNoInteractions(vehiculoService, compraRepository, clienteService, pdfService);
    }

    @ParameterizedTest
    @EnumSource(value = TipoCliente.class, names = {"VENDEDOR", "AMBOS"})
    void gerenciaRecibeCompraConCostoYComprobante(TipoCliente tipo) {
        Compra compra = prepararAlta(tipo);
        when(pdfService.generarComprobante(eq("COMPRA"), anyList())).thenReturn("compra.pdf");
        var result = assertInstanceOf(CompraResponse.class, service.crear(solicitud(LocalDate.now())));
        assertEquals(new BigDecimal("10000"), result.costoAdquisicion());
        assertEquals(new BigDecimal("10000"), compra.getVehiculo().getCostoInicial());
        assertEquals("compra.pdf", compra.getComprobantePath());
        verify(compraRepository, times(2)).save(any(Compra.class));
        verify(auditoriaService).registrar(eq("ALTA"), eq("Compra"), eq(10L), anyString(), isNull(), anyString());
    }

    @Test
    void falloDePdfSePropagaSinAuditarExito() {
        prepararAlta(TipoCliente.VENDEDOR);
        when(pdfService.generarComprobante(eq("COMPRA"), anyList()))
                .thenThrow(new BusinessException("No se pudo escribir el comprobante"));
        assertThrows(BusinessException.class, () -> service.crear(solicitud(LocalDate.now())));
        verify(compraRepository).save(any());
        verifyNoInteractions(auditoriaService);
        // La reversión real la comprueba FinancialRollbackIntegrationTest con un proxy transaccional.
    }

    @ParameterizedTest
    @EnumSource(DestinoPostCompra.class)
    void destinoPosteriorACompraActualizaSoloElEstadoDelVehiculo(DestinoPostCompra destino) {
        Compra compra = compraCompleta();
        compra.getVehiculo().setEstado(EstadoVehiculo.COMPRADO);
        when(compraRepository.findById(10L)).thenReturn(Optional.of(compra));
        when(vehiculoService.buscarActivoPorIdConBloqueo(1L)).thenReturn(compra.getVehiculo());

        var response = service.definirDestinoPostCompra(
                10L,
                new DefinirDestinoPostCompraRequest(destino));

        EstadoVehiculo esperado = destino == DestinoPostCompra.REQUIERE_TALLER
                ? EstadoVehiculo.EN_TALLER
                : EstadoVehiculo.DISPONIBLE;
        assertEquals(esperado, response.estadoVehiculo());
        verify(vehiculoService).cambiarEstadoPorSistema(
                eq(compra.getVehiculo()),
                eq(esperado),
                anyString());
    }

    @Test
    void destinoPosteriorACompraNoPuedeRepetirseSiElVehiculoYaAvanzo() {
        Compra compra = compraCompleta();
        compra.getVehiculo().setEstado(EstadoVehiculo.EN_TALLER);
        when(compraRepository.findById(10L)).thenReturn(Optional.of(compra));
        when(vehiculoService.buscarActivoPorIdConBloqueo(1L)).thenReturn(compra.getVehiculo());

        assertThrows(BusinessException.class, () -> service.definirDestinoPostCompra(
                10L,
                new DefinirDestinoPostCompraRequest(DestinoPostCompra.PUEDE_QUEDAR_DISPONIBLE)));
        verify(vehiculoService, never()).cambiarEstadoPorSistema(any(), any(), anyString());
    }

    @Test
    void consultaYComprobanteRechazanCompraInactivaOInexistente() {
        assertThrows(ResourceNotFoundException.class, () -> service.obtener(1L));
        assertThrows(ResourceNotFoundException.class, () -> service.obtenerComprobante(1L));
        Compra compra = new Compra();
        compra.setActivo(false);
        when(compraRepository.findById(1L)).thenReturn(Optional.of(compra));
        assertThrows(ResourceNotFoundException.class, () -> service.obtener(1L));
        assertThrows(ResourceNotFoundException.class, () -> service.obtenerComprobante(1L));
        verifyNoInteractions(pdfService);
    }

    @Test
    void consultarComprobantePropagaArchivoInexistente() {
        Compra compra = new Compra();
        compra.setComprobantePath("ausente.pdf");
        when(compraRepository.findById(1L)).thenReturn(Optional.of(compra));
        when(pdfService.cargarComprobante("ausente.pdf")).thenThrow(new ResourceNotFoundException("Ausente"));
        assertThrows(ResourceNotFoundException.class, () -> service.obtenerComprobante(1L));
    }

    @Test
    void listadosConservanMetadatosDelServidor() {
        Compra compra = compraCompleta();
        when(compraRepository.findById(10L)).thenReturn(Optional.of(compra));
        when(compraRepository.findByActivoTrueOrderByFechaCompraDesc()).thenReturn(List.of(compra));
        when(compraRepository.findByActivoTrueOrderByFechaCompraDesc(PageRequest.of(1, 2)))
                .thenReturn(new PageImpl<>(List.of(compra), PageRequest.of(1, 2), 3));
        assertEquals(10L, service.obtener(10L).id());
        assertEquals(10L, service.listar().get(0).id());
        var page = service.listarPaginado(1, 2);
        assertEquals(3, page.totalElements());
        assertEquals(2, page.totalPages());
        assertEquals(1, page.page());
        assertEquals(10L, page.content().get(0).id());
    }

    @ParameterizedTest
    @CsvSource({"-1,10", "0,0", "0,101"})
    void paginacionInvalidaNoConsultaRepositorio(int page, int size) {
        assertThrows(BusinessException.class, () -> service.listarPaginado(page, size));
        verifyNoInteractions(compraRepository);
    }

    @Test
    void compraActivaEsObligatoriaParaConsultarOrigen() {
        Vehiculo v = new Vehiculo();
        assertThrows(BusinessException.class, () -> service.buscarActivaPorVehiculo(v));
        Compra compra = new Compra();
        when(compraRepository.findByVehiculoAndActivoTrue(v)).thenReturn(Optional.of(compra));
        assertSame(compra, service.buscarActivaPorVehiculo(v));
    }

    private CompraRequest solicitud(LocalDate fecha) {
        return new CompraRequest(1L, 2L, fecha, new BigDecimal("10000"), null);
    }

    private Compra prepararAlta(TipoCliente tipo) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                "gerente", "n/a", List.of(new SimpleGrantedAuthority("ROLE_DUENO"))));
        Compra compra = compraCompleta();
        compra.getClienteVendedor().setTipoCliente(tipo);
        when(usuarioActualService.exigirRoles(any(String[].class))).thenReturn(compra.getUsuarioResponsable());
        when(vehiculoService.buscarActivoPorIdConBloqueo(1L)).thenReturn(compra.getVehiculo());
        when(clienteService.buscarActivoPorId(2L)).thenReturn(compra.getClienteVendedor());
        when(compraRepository.save(any(Compra.class))).thenAnswer(inv -> {
            Compra nueva = inv.getArgument(0);
            compra.setCostoAdquisicion(nueva.getCostoAdquisicion());
            compra.setComprobantePath(nueva.getComprobantePath());
            return compra;
        });
        return compra;
    }

    private Compra compraCompleta() {
        Vehiculo v = new Vehiculo();
        v.setId(1L);
        v.setMarca("Toyota");
        v.setModelo("Corolla");
        v.setAnio(2020);
        Cliente cliente = new Cliente();
        cliente.setId(2L);
        cliente.setNombre("Ana");
        cliente.setApellido("Pérez");
        cliente.setDocumento("123");
        Usuario user = new Usuario();
        user.setId(7L);
        user.setNombre("Gerente");
        Compra compra = new Compra();
        compra.setId(10L);
        compra.setVehiculo(v);
        compra.setClienteVendedor(cliente);
        compra.setUsuarioResponsable(user);
        compra.setFechaCompra(LocalDate.now());
        compra.setCostoAdquisicion(new BigDecimal("10000"));
        return compra;
    }
}
