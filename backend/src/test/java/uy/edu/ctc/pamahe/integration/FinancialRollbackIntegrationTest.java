package uy.edu.ctc.pamahe.integration;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.common.util.PdfService;
import uy.edu.ctc.pamahe.modules.auditoria.repository.AuditoriaRepository;
import uy.edu.ctc.pamahe.modules.clientes.model.Cliente;
import uy.edu.ctc.pamahe.modules.clientes.model.TipoCliente;
import uy.edu.ctc.pamahe.modules.clientes.repository.ClienteRepository;
import uy.edu.ctc.pamahe.modules.compras.dto.request.CompraRequest;
import uy.edu.ctc.pamahe.modules.compras.model.Compra;
import uy.edu.ctc.pamahe.modules.compras.repository.CompraRepository;
import uy.edu.ctc.pamahe.modules.compras.service.CompraService;
import uy.edu.ctc.pamahe.modules.roles.model.Rol;
import uy.edu.ctc.pamahe.modules.roles.repository.RolRepository;
import uy.edu.ctc.pamahe.modules.usuarios.model.Usuario;
import uy.edu.ctc.pamahe.modules.usuarios.repository.UsuarioRepository;
import uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.repository.VehiculoRepository;
import uy.edu.ctc.pamahe.modules.ventas.dto.request.VentaRequest;
import uy.edu.ctc.pamahe.modules.ventas.model.CanalOrigenVenta;
import uy.edu.ctc.pamahe.modules.ventas.model.MedioPagoVenta;
import uy.edu.ctc.pamahe.modules.ventas.repository.VentaRepository;
import uy.edu.ctc.pamahe.modules.ventas.service.VentaService;

/**
 * Comprueba rollback del proxy Spring sobre H2; no certifica locks ni
 * migraciones de MySQL.
 */
@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:pamahe_rollback;MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE")
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class FinancialRollbackIntegrationTest {
    @Autowired
    CompraService compraService;
    @Autowired
    VentaService ventaService;
    @Autowired
    CompraRepository compras;
    @Autowired
    VentaRepository ventas;
    @Autowired
    VehiculoRepository vehiculos;
    @Autowired
    ClienteRepository clientes;
    @Autowired
    UsuarioRepository usuarios;
    @Autowired
    RolRepository roles;
    @Autowired
    AuditoriaRepository auditorias;
    @Autowired
    PlatformTransactionManager transactionManager;
    @MockitoBean
    PdfService pdf;
    private TransactionTemplate transaction;
    private Long vehiculoId;
    private Long clienteId;
    private Long usuarioId;

    @BeforeEach
    void prepararDatosConfirmados() {
        transaction = new TransactionTemplate(transactionManager);

        transaction.executeWithoutResult(status -> {
            auditorias.deleteAll();
            ventas.deleteAll();
            compras.deleteAll();
            vehiculos.deleteAll();
            clientes.deleteAll();
            usuarios.deleteAll();

            // Fuerza la ejecución de los DELETE antes de volver a insertar
            usuarios.flush();

            Rol rol = roles.findByNombre("VENDEDOR")
                    .orElseGet(() -> {
                        Rol nuevoRol = new Rol();
                        nuevoRol.setNombre("VENDEDOR");
                        return roles.save(nuevoRol);
                    });

            Usuario u = new Usuario();
            u.setUsername("rollback-test");
            u.setPasswordHash("no-se-usa-en-esta-prueba");
            u.setNombre("Prueba transaccional");
            u.setEmail("rollback@example.test");
            u.setRoles(Set.of(rol));

            usuarioId = usuarios.save(u).getId();

            Cliente c = new Cliente();
            c.setNombre("Cliente prueba");
            c.setDocumento("ROLLBACK1");
            c.setTipoCliente(TipoCliente.AMBOS);

            clienteId = clientes.save(c).getId();

            Vehiculo v = new Vehiculo();
            v.setMarca("Toyota");
            v.setModelo("Corolla");
            v.setAnio(2020);
            v.setCostoInicial(BigDecimal.ZERO);

            vehiculoId = vehiculos.save(v).getId();
        });

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "rollback-test",
                        "n/a",
                        List.of(new SimpleGrantedAuthority("ROLE_VENDEDOR"))));
    }

    @AfterEach
    void limpiarSesion() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void falloDePdfRevierteCompraYCostoInicial() {
        when(pdf.generarComprobante(eq("COMPRA"), anyList()))
                .thenThrow(new BusinessException("Fallo de escritura simulado"));
        assertThrows(BusinessException.class, () -> compraService.crear(
                new CompraRequest(vehiculoId, clienteId, LocalDate.now(), new BigDecimal("10000.00"), null)));
        transaction.executeWithoutResult(status -> {
            assertEquals(0, compras.count());
            assertEquals(0, auditorias.count());
            Vehiculo v = vehiculos.findById(vehiculoId).orElseThrow();
            assertEquals(0, BigDecimal.ZERO.compareTo(v.getCostoInicial()));
            assertEquals(EstadoVehiculo.COMPRADO, v.getEstado());
        });
    }

    @Test
    void rollbackPosteriorALaVentaRevierteEstadoPublicacionYAuditoria() {
        transaction.executeWithoutResult(status -> {
            Vehiculo v = vehiculos.findById(vehiculoId).orElseThrow();
            v.setEstado(EstadoVehiculo.DISPONIBLE);
            v.setPublicado(true);
            v.setPrecioVentaEstimado(new BigDecimal("15000.00"));
            v.setCostoInicial(new BigDecimal("10000.00"));
            Compra c = new Compra();
            c.setVehiculo(v);
            c.setClienteVendedor(clientes.findById(clienteId).orElseThrow());
            c.setUsuarioResponsable(usuarios.findById(usuarioId).orElseThrow());
            c.setFechaCompra(LocalDate.now().minusDays(1));
            c.setCostoAdquisicion(new BigDecimal("10000.00"));
            compras.save(c);
        });
        assertThrows(BusinessException.class, () -> transaction.executeWithoutResult(status -> {
            ventaService.crear(new VentaRequest(vehiculoId, clienteId, LocalDate.now(),
                    new BigDecimal("15000.00"), MedioPagoVenta.TRANSFERENCIA, null, null, null, CanalOrigenVenta.PRESENCIAL, true, true, true, null, null));
            throw new BusinessException("Fallo antes del commit externo");
        }));
        // Un evento AFTER_COMMIT nunca debe generar archivos para una transacción revertida.
        verify(pdf, never()).generarComprobante(eq("VENTA"), anyList());
        transaction.executeWithoutResult(status -> {
            assertEquals(0, ventas.count());
            assertEquals(1, compras.count());
            assertEquals(0, auditorias.count());
            Vehiculo v = vehiculos.findById(vehiculoId).orElseThrow();
            assertEquals(EstadoVehiculo.DISPONIBLE, v.getEstado());
            assertTrue(v.getPublicado());
        });
    }
}
