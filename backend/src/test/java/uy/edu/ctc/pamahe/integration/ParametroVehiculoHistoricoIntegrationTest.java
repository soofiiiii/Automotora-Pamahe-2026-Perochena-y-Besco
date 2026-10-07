package uy.edu.ctc.pamahe.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;

import java.math.BigDecimal;
import java.util.List;

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

import uy.edu.ctc.pamahe.modules.parametros.dto.request.ParametroRequest;
import uy.edu.ctc.pamahe.modules.parametros.service.ParametroService;
import uy.edu.ctc.pamahe.modules.vehiculos.dto.request.VehiculoRequest;
import uy.edu.ctc.pamahe.modules.vehiculos.model.UbicacionVehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.dto.response.VehiculoResponse;
import uy.edu.ctc.pamahe.modules.vehiculos.service.VehiculoService;

/**
 * CF-03: demuestra el ciclo parametrizable completo sin recompilar.
 * Un tipo creado desde ABM deja de ofrecerse al desactivarlo, pero el vehículo
 * que ya lo usa conserva exactamente la etiqueta de negocio original.
 */
@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:pamahe_cf03;MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE")
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class ParametroVehiculoHistoricoIntegrationTest {

    @Autowired
    ParametroService parametroService;

    @Autowired
    VehiculoService vehiculoService;

    @BeforeEach
    void autenticarAdministrador() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "cf03-admin",
                        "n/a",
                        List.of(new SimpleGrantedAuthority("ROLE_ADMINISTRADOR"))));
    }

    @AfterEach
    void limpiarSesion() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void crearUsarDesactivarConservaLabelHistoricoExacto() {
        var parametro = parametroService.crear(new ParametroRequest(
                "TIPO_VEHICULO",
                "UTE_DOBLE_CF03",
                "Utilitario doble cabina",
                "Tipo dinámico de prueba CF-03"));

        VehiculoResponse creado = assertInstanceOf(
                VehiculoResponse.class,
                vehiculoService.crear(new VehiculoRequest(
                        "JAC",
                        "T8",
                        "UTE_DOBLE_CF03",
                        2024,
                        "CF03-001",
                        null,
                        "Blanco",
                        1000,
                        UbicacionVehiculo.LOCAL,
                        new BigDecimal("25000.00"),
                        "Vehículo de prueba CF-03",
                        null)));

        assertEquals("UTE_DOBLE_CF03", creado.tipoVehiculo());
        assertEquals("Utilitario doble cabina", creado.tipoVehiculoLabel());

        parametroService.desactivar(parametro.id());

        assertFalse(parametroService.listarPorCategoria("TIPO_VEHICULO").stream()
                .anyMatch(p -> "UTE_DOBLE_CF03".equals(p.clave())));

        VehiculoResponse historico = assertInstanceOf(
                VehiculoResponse.class,
                vehiculoService.obtener(creado.id()));

        assertEquals("UTE_DOBLE_CF03", historico.tipoVehiculo());
        assertEquals("Utilitario doble cabina", historico.tipoVehiculoLabel());
    }
}
