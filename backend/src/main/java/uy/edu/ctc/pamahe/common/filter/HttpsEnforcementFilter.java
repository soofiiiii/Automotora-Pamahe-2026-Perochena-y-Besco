package uy.edu.ctc.pamahe.common.filter;

import java.io.IOException;

import org.springframework.context.annotation.Profile;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import uy.edu.ctc.pamahe.security.handler.SecurityErrorWriter;

/**
 * Defensa en profundidad para producción. El backend se publica detrás de un reverse proxy TLS;
 * cualquier solicitud que llegue sin HTTPS (directa o sin X-Forwarded-Proto=https) se rechaza.
 * En producción el puerto de Spring se enlaza por defecto a loopback, por lo que el encabezado
 * reenviado solo debe provenir del proxy de confianza del mismo host.
 */
@Component
@Profile("prod")
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
public class HttpsEnforcementFilter extends OncePerRequestFilter {

    private final SecurityErrorWriter errorWriter;

    public HttpsEnforcementFilter(SecurityErrorWriter errorWriter) {
        this.errorWriter = errorWriter;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (isHttps(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        this.errorWriter.write(
                request,
                response,
                HttpStatus.UPGRADE_REQUIRED.value(),
                "HTTPS_REQUIRED",
                "La API de producción solo acepta comunicación HTTPS.",
                new IllegalStateException("Insecure production request rejected"));
    }

    private boolean isHttps(HttpServletRequest request) {
        if (request.isSecure()) {
            return true;
        }
        String forwardedProto = request.getHeader("X-Forwarded-Proto");
        if (forwardedProto == null || forwardedProto.isBlank()) {
            return false;
        }
        String firstValue = forwardedProto.split(",", 2)[0].trim();
        return "https".equalsIgnoreCase(firstValue) && isLoopback(request.getRemoteAddr());
    }

    private boolean isLoopback(String remoteAddress) {
        return "127.0.0.1".equals(remoteAddress)
                || "::1".equals(remoteAddress)
                || "0:0:0:0:0:0:0:1".equals(remoteAddress);
    }
}
