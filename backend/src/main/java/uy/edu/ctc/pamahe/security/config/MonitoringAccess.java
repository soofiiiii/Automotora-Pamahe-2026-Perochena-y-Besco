package uy.edu.ctc.pamahe.security.config;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import jakarta.servlet.http.HttpServletRequest;

/** Acceso del collector local; credencial independiente de sesiones y roles de negocio. */
@Component
public class MonitoringAccess {
    public static final String HEADER = "X-Monitoring-Token";
    private final byte[] expected;

    public MonitoringAccess(@Value("${app.monitoring.scrape-token:}") String token) {
        if (!token.isEmpty() && !token.matches("[A-Za-z0-9_-]{43,128}")) {
            throw new IllegalStateException("MONITORING_SCRAPE_TOKEN debe ser aleatorio y contener 43..128 caracteres Base64URL/hex.");
        }
        this.expected = token.getBytes(StandardCharsets.UTF_8);
    }

    public boolean allowed(HttpServletRequest request) {
        String peer = request.getRemoteAddr();
        boolean local = "127.0.0.1".equals(peer) || "::1".equals(peer) || "0:0:0:0:0:0:0:1".equals(peer);
        String supplied = request.getHeader(HEADER);
        return local && expected.length > 0 && supplied != null && supplied.length() <= 128
                && MessageDigest.isEqual(expected, supplied.getBytes(StandardCharsets.UTF_8));
    }
}
