package uy.edu.ctc.pamahe.security;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityAuthorizationIntegrationTest {

    @Autowired
    MockMvc mockMvc;

    @Test
    void compraPrivadaSinTokenDevuelve401() throws Exception {
        mockMvc.perform(get("/compras"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void vendedorNoPuedeConsultarCompras() throws Exception {
        mockMvc.perform(
                get("/compras")
                        .with(user("vendedor").roles("VENDEDOR"))
        )
        .andExpect(status().isForbidden());
    }

    @Test
    void tallerNoPuedeConsultarCostos() throws Exception {
        mockMvc.perform(
                get("/costos/vehiculos/1")
                        .with(user("taller").roles("TALLER"))
        )
        .andExpect(status().isForbidden());
    }

    @Test
    void vendedorPuedeConsultarVehiculos() throws Exception {
        mockMvc.perform(
                get("/vehiculos")
                        .with(user("vendedor").roles("VENDEDOR"))
        )
        .andExpect(status().isOk());
    }

    @Test
    void catalogoEsPublico() throws Exception {
        mockMvc.perform(get("/catalogo/vehiculos"))
                .andExpect(status().isOk());
    }
}