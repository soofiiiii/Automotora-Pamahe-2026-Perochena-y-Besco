package uy.edu.ctc.pamahe.security;

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import uy.edu.ctc.pamahe.modules.ventas.service.VentaService;

@SpringBootTest(properties = "app.monitoring.scrape-token=abcdefghijklmnopqrstuvwxyz0123456789abcdefghijk")
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MonitoringIntegrationTest {
    private static final String TOKEN = "abcdefghijklmnopqrstuvwxyz0123456789abcdefghijk";
    @Autowired MockMvc mvc;
    @MockitoBean VentaService ventas;

    @Test
    void collectorLocalConSecretoObtienePrometheus() throws Exception {
        mvc.perform(get("/actuator/prometheus").header("X-Monitoring-Token", TOKEN)
                .with(r -> { r.setRemoteAddr("127.0.0.1"); return r; }))
            .andExpect(status().isOk())
            .andExpect(content().string(org.hamcrest.Matchers.containsString("jvm_memory_used_bytes")));
    }

    @Test
    void noPublicaMetricasSinCredencialNiDesdeIpRemota() throws Exception {
        mvc.perform(get("/actuator/prometheus")).andExpect(status().isUnauthorized());
        mvc.perform(get("/actuator/prometheus").header("X-Monitoring-Token", "incorrecto"))
            .andExpect(status().isUnauthorized());
        mvc.perform(get("/actuator/prometheus").header("X-Monitoring-Token", TOKEN)
                .header("X-Forwarded-For", "127.0.0.1").with(user("dueno").roles("DUENO"))
                .with(r -> { r.setRemoteAddr("203.0.113.10"); return r; }))
            .andExpect(status().isForbidden());
    }

    @Test
    void incidenteDeErrorConservaCorrelationIdEnRespuesta() throws Exception {
        when(ventas.listar()).thenThrow(new IllegalStateException("Fallo controlado del test"));
        mvc.perform(get("/ventas").with(user("vendedor").roles("VENDEDOR"))
                .header("X-Correlation-Id", "pamahe-test-incident-001"))
            .andExpect(status().isInternalServerError())
            .andExpect(header().string("X-Correlation-Id", "pamahe-test-incident-001"))
            .andExpect(jsonPath("$.incidenteId").value("pamahe-test-incident-001"))
            .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("Fallo controlado"))));
    }

    @Test
    void healthDeBaseNoExponeDetalles() throws Exception {
        mvc.perform(get("/actuator/health/database"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("UP"))
            .andExpect(jsonPath("$.components").doesNotExist()).andExpect(jsonPath("$.details").doesNotExist());
    }
}
