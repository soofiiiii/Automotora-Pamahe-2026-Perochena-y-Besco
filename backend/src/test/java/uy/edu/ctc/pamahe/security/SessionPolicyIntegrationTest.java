package uy.edu.ctc.pamahe.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.time.Instant;
import java.util.Date;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

/** Usa firmas y filtros reales; no espera con sleep ni simula la expiración del filtro. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SessionPolicyIntegrationTest {
    @Autowired MockMvc mvc;
    @Value("${security.jwt.secret}") String secret;
    @Value("${security.jwt.issuer}") String issuer;
    @Value("${security.jwt.expiration-minutes}") int minutes;

    @Test
    void politicaPublicaCoincideConConfiguracionSinRefresh() throws Exception {
        mvc.perform(get("/auth/session-policy"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.renewalMode").value("REAUTHENTICATE"))
            .andExpect(jsonPath("$.data.accessTokenMinutes").value(minutes))
            .andExpect(jsonPath("$.data.refreshTokenEnabled").value(false));
    }

    @Test
    void tokenVencidoDevuelve401YNoRenuevaSesion() throws Exception {
        String token = Jwts.builder().issuer(issuer).subject("sesion-vencida")
            .issuedAt(Date.from(Instant.now().minusSeconds(120)))
            .expiration(Date.from(Instant.now().minusSeconds(60)))
            .signWith(Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret))).compact();
        mvc.perform(get("/auth/me").header("Authorization", "Bearer " + token))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.codigo").value("AUTH_TOKEN_EXPIRED"))
            .andExpect(jsonPath("$.incidenteId").isNotEmpty())
            .andExpect(header().doesNotExist("Authorization"))
            .andExpect(header().doesNotExist("Set-Cookie"));
        // La siguiente solicitud sigue anónima: no existe sesión de servidor recuperable.
        mvc.perform(get("/auth/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void firmaValidaSinExpiracionNoCreaSesionInfinita() throws Exception {
        String token = Jwts.builder().issuer(issuer).subject("sin-expiracion")
            .signWith(Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret))).compact();
        mvc.perform(get("/auth/me").header("Authorization", "Bearer " + token))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.codigo").value("AUTH_TOKEN_INVALID"));
    }
}
