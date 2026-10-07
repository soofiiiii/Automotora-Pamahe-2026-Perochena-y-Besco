package uy.edu.ctc.pamahe.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.fail;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.common.util.PdfService;
import uy.edu.ctc.pamahe.modules.auditoria.repository.AuditoriaRepository;
import uy.edu.ctc.pamahe.modules.clientes.model.Cliente;
import uy.edu.ctc.pamahe.modules.clientes.model.TipoCliente;
import uy.edu.ctc.pamahe.modules.clientes.repository.ClienteRepository;
import uy.edu.ctc.pamahe.modules.compras.model.Compra;
import uy.edu.ctc.pamahe.modules.compras.repository.CompraRepository;
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
import uy.edu.ctc.pamahe.modules.ventas.job.VentaComprobanteReconciliacionJob;
import uy.edu.ctc.pamahe.modules.ventas.model.EstadoComprobanteVenta;
import uy.edu.ctc.pamahe.modules.ventas.repository.VentaRepository;
import uy.edu.ctc.pamahe.modules.ventas.service.VentaService;

/**
* Prueba para asegurar que si el proceso falla al inicio,
* el sistema conserve el estado de forma segura, se reconcilie correctamente,
 * y permita la descarga HTTP final sin duplicar la venta.
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:pamahe_cf04;MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE",
        "app.comprobantes.reconciliacion-ms=3600000",
        "app.comprobantes.reconciliacion-inicial-ms=3600000"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class VentaComprobanteRecoveryIntegrationTest {

    @Autowired
    VentaService ventaService;
    @Autowired
    VentaComprobanteReconciliacionJob reconciliacionJob;
    @Autowired
    VentaRepository ventas;
    @Autowired
    CompraRepository compras;
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
    @Autowired
    MockMvc mvc;

    @MockitoBean
    PdfService pdfService;

    private TransactionTemplate transaction;
    private Long vehiculoId;
    private Long clienteId;

    @BeforeEach
    void prepararDatos() {
        transaction = new TransactionTemplate(transactionManager);
        transaction.executeWithoutResult(status -> {
            auditorias.deleteAll();
            ventas.deleteAll();
            compras.deleteAll();
            vehiculos.deleteAll();
            clientes.deleteAll();
            usuarios.deleteAll();
            usuarios.flush();

            Rol vendedor = rol("VENDEDOR");
            Usuario usuario = new Usuario();
            usuario.setUsername("cf04-vendedor");
            usuario.setPasswordHash("no-se-usa-en-esta-prueba");
            usuario.setNombre("Vendedor CF04");
            usuario.setEmail("cf04-vendedor@example.test");
            usuario.setRoles(Set.of(vendedor));
            usuarios.save(usuario);

            Cliente cliente = new Cliente();
            cliente.setNombre("Comprador CF04");
            cliente.setDocumento("CF04001");
            cliente.setTipoCliente(TipoCliente.AMBOS);
            clienteId = clientes.save(cliente).getId();

            Vehiculo vehiculo = new Vehiculo();
            vehiculo.setMarca("Toyota");
            vehiculo.setModelo("Corolla");
            vehiculo.setAnio(2022);
            vehiculo.setEstado(EstadoVehiculo.DISPONIBLE);
            vehiculo.setPublicado(true);
            vehiculo.setCostoInicial(new BigDecimal("10000.00"));
            vehiculo.setPrecioVentaEstimado(new BigDecimal("15000.00"));
            vehiculoId = vehiculos.save(vehiculo).getId();

            Compra compra = new Compra();
            compra.setVehiculo(vehiculo);
            compra.setClienteVendedor(cliente);
            compra.setUsuarioResponsable(usuario);
            compra.setFechaCompra(LocalDate.now().minusDays(1));
            compra.setCostoAdquisicion(new BigDecimal("10000.00"));
            compras.save(compra);
        });
    }

    @AfterEach
    void limpiarSesion() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void falloTransitorioSeRecuperaTrasReconciliacionYPermiteDescargaSinDuplicarVenta() throws Exception {
        when(pdfService.generarComprobante(eq("VENTA"), anyList()))
                .thenThrow(new BusinessException("/ruta/interna/no-debe-exponerse"))
                .thenReturn("ventas/venta-cf04-recovery.pdf");

        byte[] pdf = "%PDF-1.4\nCF04\n%%EOF".getBytes(StandardCharsets.US_ASCII);
        when(pdfService.cargarComprobante("ventas/venta-cf04-recovery.pdf"))
                .thenReturn(new PdfService.ComprobanteResource(
                        new ByteArrayResource(pdf),
                        "venta-cf04-recovery.pdf"));

        autenticar("cf04-vendedor", "VENDEDOR");
        var creada = ventaService.crear(new VentaRequest(
                vehiculoId,
                clienteId,
                LocalDate.now(),
                new BigDecimal("15000.00"),
                MedioPagoVenta.TRANSFERENCIA, null, null, null, CanalOrigenVenta.PRESENCIAL,
                true, true, true, null,
                "Venta con recuperación CF-04"));

        Long ventaId = creada.id();
        assertNotNull(ventaId);
        esperarEstado(ventaId, EstadoComprobanteVenta.ERROR);

        var observableError = ventaService.obtener(ventaId);
        assertEquals(EstadoComprobanteVenta.ERROR, observableError.estadoComprobante());
        assertEquals(1, observableError.intentosComprobante());
        assertEquals(null, observableError.comprobanteUrl());

        transaction.executeWithoutResult(status -> {
            var venta = ventas.findById(ventaId).orElseThrow();
            assertEquals("No se pudo generar el comprobante PDF en el último intento.", venta.getErrorComprobante());
            venta.setProximoIntentoComprobante(LocalDateTime.now().minusSeconds(1));
        });

        // Simula la reconciliación de arranque: el trabajo pendiente existe en DB y
        // puede retomarse aunque el evento original ya no esté en memoria.
        SecurityContextHolder.clearContext();
        reconciliacionJob.reconciliarAlArranque();
        esperarEstado(ventaId, EstadoComprobanteVenta.GENERADO);

        transaction.executeWithoutResult(status -> {
            var venta = ventas.findById(ventaId).orElseThrow();
            assertEquals(2, venta.getIntentosComprobante());
            assertEquals("ventas/venta-cf04-recovery.pdf", venta.getComprobantePath());
            assertEquals(null, venta.getErrorComprobante());
            assertEquals(1, ventas.count());
        });

        mvc.perform(get("/ventas/{id}", ventaId)
                        .with(user("cf04-vendedor").roles("VENDEDOR")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.estadoComprobante").value("GENERADO"))
                .andExpect(jsonPath("$.data.intentosComprobante").value(2))
                .andExpect(jsonPath("$.data.comprobanteUrl").value("/api/ventas/" + ventaId + "/comprobante"));

        mvc.perform(get("/ventas/{id}/comprobante", ventaId)
                        .with(user("cf04-vendedor").roles("VENDEDOR")))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION,
                        org.hamcrest.Matchers.containsString("venta-cf04-recovery.pdf")))
                .andExpect(content().bytes(pdf));

        verify(pdfService, times(2)).generarComprobante(eq("VENTA"), anyList());
    }

    private Rol rol(String nombre) {
        return roles.findByNombre(nombre).orElseGet(() -> {
            Rol rol = new Rol();
            rol.setNombre(nombre);
            return roles.save(rol);
        });
    }

    private void autenticar(String username, String rol) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        username,
                        "n/a",
                        List.of(new SimpleGrantedAuthority("ROLE_" + rol))));
    }

    private void esperarEstado(Long ventaId, EstadoComprobanteVenta esperado) {
        long limite = System.nanoTime() + Duration.ofSeconds(5).toNanos();
        EstadoComprobanteVenta ultimo = null;

        while (System.nanoTime() < limite) {
            ultimo = transaction.execute(status -> ventas.findById(ventaId)
                    .map(v -> v.getEstadoComprobante())
                    .orElse(null));
            if (ultimo == esperado) {
                return;
            }
            try {
                Thread.sleep(25);
            } catch (InterruptedException interrupted) {
                Thread.currentThread().interrupt();
                fail("La espera del comprobante fue interrumpida.");
            }
        }

        fail("El comprobante no alcanzó el estado " + esperado + "; último estado observado: " + ultimo);
    }
}
