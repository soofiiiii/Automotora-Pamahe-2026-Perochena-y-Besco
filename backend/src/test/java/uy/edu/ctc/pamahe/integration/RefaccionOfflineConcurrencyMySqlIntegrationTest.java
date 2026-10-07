package uy.edu.ctc.pamahe.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.RepeatedTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.mysql.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import uy.edu.ctc.pamahe.common.exception.IdempotencyConflictException;
import uy.edu.ctc.pamahe.modules.clientes.model.Cliente;
import uy.edu.ctc.pamahe.modules.clientes.model.TipoCliente;
import uy.edu.ctc.pamahe.modules.clientes.repository.ClienteRepository;
import uy.edu.ctc.pamahe.modules.compras.model.Compra;
import uy.edu.ctc.pamahe.modules.compras.repository.CompraRepository;
import uy.edu.ctc.pamahe.modules.roles.model.Rol;
import uy.edu.ctc.pamahe.modules.roles.repository.RolRepository;
import uy.edu.ctc.pamahe.modules.taller.dto.request.RefaccionRequest;
import uy.edu.ctc.pamahe.modules.taller.dto.response.RefaccionResponse;
import uy.edu.ctc.pamahe.modules.taller.idempotency.RefaccionOperacionOfflineRepository;
import uy.edu.ctc.pamahe.modules.taller.model.EstadoTarea;
import uy.edu.ctc.pamahe.modules.taller.model.TipoTrabajo;
import uy.edu.ctc.pamahe.modules.taller.repository.RefaccionRepository;
import uy.edu.ctc.pamahe.modules.taller.service.RefaccionService;
import uy.edu.ctc.pamahe.modules.usuarios.model.Usuario;
import uy.edu.ctc.pamahe.modules.usuarios.repository.UsuarioRepository;
import uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.repository.VehiculoRepository;

/**
 * Verifica la idempotencia offline bajo concurrencia real de MySQL.
 *
 * Cada repetición lanza dos transacciones Spring simultáneas...
 */
@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
class RefaccionOfflineConcurrencyMySqlIntegrationTest {

    private static final int REPETICIONES = 5;
    private static final int TIMEOUT_SEGUNDOS = 15;

    @Container
    static final MySQLContainer MYSQL = new MySQLContainer(DockerImageName.parse("mysql:8.4"))
            .withDatabaseName("pamahe_cq02")
            .withUsername("pamahe_test")
            .withPassword("pamahe_test")
            .withCommand("--log-bin-trust-function-creators=1");

    @DynamicPropertySource
    static void configurarMySql(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "com.mysql.cj.jdbc.Driver");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
        registry.add("spring.flyway.enabled", () -> "true");
    }

    @Autowired
    RefaccionService refaccionService;
    @Autowired
    RefaccionRepository refacciones;
    @Autowired
    RefaccionOperacionOfflineRepository operacionesOffline;
    @Autowired
    VehiculoRepository vehiculos;
    @Autowired
    CompraRepository compras;
    @Autowired
    ClienteRepository clientes;
    @Autowired
    UsuarioRepository usuarios;
    @Autowired
    RolRepository roles;
    @Autowired
    JdbcTemplate jdbc;

    private String username;
    private Long vehiculoId;

    @BeforeEach
    void prepararDatos() {
        String sufijo = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        Rol taller = roles.findByNombre("TALLER").orElseThrow();

        Usuario usuario = new Usuario();
        usuario.setUsername("cq02-" + sufijo);
        usuario.setPasswordHash("fixture-no-login");
        usuario.setNombre("Operador CQ02");
        usuario.setEmail("cq02-" + sufijo + "@example.test");
        usuario.setRoles(Set.of(taller));
        usuario = usuarios.saveAndFlush(usuario);
        username = usuario.getUsername();

        Cliente vendedor = new Cliente();
        vendedor.setNombre("Vendedor CQ02");
        vendedor.setDocumento("CQ02-" + sufijo);
        vendedor.setTipoCliente(TipoCliente.VENDEDOR);
        vendedor = clientes.saveAndFlush(vendedor);

        Vehiculo vehiculo = new Vehiculo();
        vehiculo.setMarca("CQ02");
        vehiculo.setModelo("Concurrencia");
        vehiculo.setAnio(2024);
        vehiculo.setEstado(EstadoVehiculo.EN_TALLER);
        vehiculo = vehiculos.saveAndFlush(vehiculo);
        vehiculoId = vehiculo.getId();

        Compra compra = new Compra();
        compra.setVehiculo(vehiculo);
        compra.setClienteVendedor(vendedor);
        compra.setUsuarioResponsable(usuario);
        compra.setFechaCompra(LocalDate.now().minusDays(1));
        compra.setCostoAdquisicion(new BigDecimal("10000.00"));
        compras.saveAndFlush(compra);
    }

    @RepeatedTest(REPETICIONES)
    void mismoIdYMismoPayloadConcurrenteCreaUnaSolaRefaccion() throws Exception {
        String idOperacion = idOperacion("same");
        RefaccionRequest request = request(idOperacion, "Cambio de aceite concurrente");

        List<ResultadoConcurrente> resultados = ejecutarConcurrente(request, request);

        assertEquals(2, resultados.stream().filter(ResultadoConcurrente::exitoso).count());
        Long primerId = resultados.get(0).respuesta().id();
        assertEquals(primerId, resultados.get(1).respuesta().id());
        assertEquals(1, contarRefacciones(idOperacion));
        assertEquals(1, contarReservas(idOperacion));

        var reserva = operacionesOffline.findById(idOperacion).orElseThrow();
        assertEquals(primerId, reserva.getRefaccionId());
        assertEquals(primerId, refacciones.findByIdOperacionOffline(idOperacion).orElseThrow().getId());
    }

    @RepeatedTest(REPETICIONES)
    void mismoIdYPayloadDistintoConcurrenteProduceConflictoSinDuplicar() throws Exception {
        String idOperacion = idOperacion("conflict");
        RefaccionRequest izquierda = request(idOperacion, "Payload A");
        RefaccionRequest derecha = request(idOperacion, "Payload B");

        List<ResultadoConcurrente> resultados = ejecutarConcurrente(izquierda, derecha);

        List<ResultadoConcurrente> exitos = resultados.stream().filter(ResultadoConcurrente::exitoso).toList();
        List<ResultadoConcurrente> errores = resultados.stream().filter(r -> !r.exitoso()).toList();

        assertEquals(1, exitos.size());
        assertEquals(1, errores.size());
        assertInstanceOf(IdempotencyConflictException.class, errores.get(0).error());
        assertEquals(1, contarRefacciones(idOperacion));
        assertEquals(1, contarReservas(idOperacion));

        Long refaccionId = refacciones.findByIdOperacionOffline(idOperacion).orElseThrow().getId();
        assertEquals(exitos.get(0).respuesta().id(), refaccionId);
        assertNotNull(operacionesOffline.findById(idOperacion).orElseThrow().getRequestHash());
    }

    private List<ResultadoConcurrente> ejecutarConcurrente(RefaccionRequest izquierda, RefaccionRequest derecha)
            throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch preparados = new CountDownLatch(2);
        CountDownLatch salida = new CountDownLatch(1);

        try {
            Future<ResultadoConcurrente> primero = executor.submit(tareaConcurrente(izquierda, preparados, salida));
            Future<ResultadoConcurrente> segundo = executor.submit(tareaConcurrente(derecha, preparados, salida));

            assertTrue(preparados.await(5, TimeUnit.SECONDS), "Los dos hilos deben quedar preparados.");
            salida.countDown();

            return List.of(
                    primero.get(TIMEOUT_SEGUNDOS, TimeUnit.SECONDS),
                    segundo.get(TIMEOUT_SEGUNDOS, TimeUnit.SECONDS));
        } finally {
            salida.countDown();
            executor.shutdownNow();
            assertTrue(executor.awaitTermination(5, TimeUnit.SECONDS),
                    "El executor debe finalizar sin hilos colgados.");
        }
    }

    private Callable<ResultadoConcurrente> tareaConcurrente(
            RefaccionRequest request,
            CountDownLatch preparados,
            CountDownLatch salida) {
        return () -> {
            autenticarTaller();
            preparados.countDown();
            try {
                assertTrue(salida.await(5, TimeUnit.SECONDS), "La barrera de concurrencia debe liberarse.");
                return ResultadoConcurrente.exito(refaccionService.crear(request));
            } catch (Throwable error) {
                return ResultadoConcurrente.error(error);
            } finally {
                SecurityContextHolder.clearContext();
            }
        };
    }

    private void autenticarTaller() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        username,
                        "n/a",
                        List.of(new SimpleGrantedAuthority("ROLE_TALLER"))));
    }

    private RefaccionRequest request(String idOperacion, String descripcion) {
        return new RefaccionRequest(
                vehiculoId,
                null,
                LocalDate.now(),
                TipoTrabajo.MECANICA,
                descripcion,
                new BigDecimal("100.00"),
                new BigDecimal("50.00"),
                BigDecimal.ZERO,
                EstadoTarea.PENDIENTE,
                "CQ-02",
                null,
                true,
                idOperacion);
    }

    private String idOperacion(String escenario) {
        return "cq02-" + escenario + "-" + UUID.randomUUID();
    }

    private long contarRefacciones(String idOperacion) {
        Long cantidad = jdbc.queryForObject(
                "SELECT COUNT(*) FROM refacciones WHERE id_operacion_offline = ?",
                Long.class,
                idOperacion);
        return cantidad == null ? 0 : cantidad;
    }

    private long contarReservas(String idOperacion) {
        Long cantidad = jdbc.queryForObject(
                "SELECT COUNT(*) FROM refaccion_operaciones_offline WHERE id_operacion = ?",
                Long.class,
                idOperacion);
        return cantidad == null ? 0 : cantidad;
    }

    private record ResultadoConcurrente(RefaccionResponse respuesta, Throwable error) {
        static ResultadoConcurrente exito(RefaccionResponse respuesta) {
            return new ResultadoConcurrente(respuesta, null);
        }

        static ResultadoConcurrente error(Throwable error) {
            return new ResultadoConcurrente(null, error);
        }

        boolean exitoso() {
            return respuesta != null;
        }
    }
}
