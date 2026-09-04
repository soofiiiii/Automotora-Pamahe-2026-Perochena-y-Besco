package uy.edu.ctc.pamahe.security.jwt;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.test.util.ReflectionTestUtils;

import io.jsonwebtoken.JwtException;

class JwtServiceTest {
    private static final String SECRET = "cGFtYWhlLXRlc3Qtc2VjcmV0LWtleS0zMi1ieXRlcy1taW5pbXVtLTIwMjY=";

    @Test
    void tokenIncluyeIssuerYEsValidoSoloParaElIssuerConfigurado() {
        JwtService emisor = servicio("pamahe-api");
        var user = new User("admin", "hash", List.of(new SimpleGrantedAuthority("ROLE_ADMINISTRADOR")));
        String token = emisor.generarToken(user);
        assertEquals("admin", emisor.obtenerUsername(token));
        assertTrue(emisor.tokenValido(token, user));

        JwtService otraApi = servicio("otra-api");
        assertThrows(JwtException.class, () -> otraApi.obtenerUsername(token));
    }

    private JwtService servicio(String issuer) {
        JwtService service = new JwtService();
        ReflectionTestUtils.setField(service, "secret", SECRET);
        ReflectionTestUtils.setField(service, "expirationMinutes", 15L);
        ReflectionTestUtils.setField(service, "issuer", issuer);
        return service;
    }
}
