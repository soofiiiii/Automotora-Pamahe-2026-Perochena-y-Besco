package uy.edu.ctc.pamahe.modules.compras.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDate;

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
import uy.edu.ctc.pamahe.modules.compras.dto.response.CompraRegistroResponse;
import uy.edu.ctc.pamahe.modules.compras.model.Compra;
import uy.edu.ctc.pamahe.modules.compras.repository.CompraRepository;
import uy.edu.ctc.pamahe.modules.usuarios.model.Usuario;
import uy.edu.ctc.pamahe.modules.usuarios.service.UsuarioActualService;
import uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo;
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

}
