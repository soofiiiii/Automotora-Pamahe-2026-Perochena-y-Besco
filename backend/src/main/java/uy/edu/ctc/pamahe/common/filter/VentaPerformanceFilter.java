package uy.edu.ctc.pamahe.common.filter;

import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import uy.edu.ctc.pamahe.common.performance.VentaTiming;

/** Instrumenta los tiempos de la operación de venta bajo el perfil de rendimiento. */
@Component
@Profile("perf")
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class VentaPerformanceFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(VentaPerformanceFilter.class);

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !"POST".equals(request.getMethod())
                || !"/ventas".equals(request.getServletPath());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain chain) throws ServletException, IOException {
        try (VentaTiming timing = VentaTiming.start()) {
            boolean completed = false;
            try {
                chain.doFilter(request, response);
                completed = true;
            } finally {
                // Incluye commit/flush, entrega del evento AFTER_COMMIT y serialización HTTP.
                // Ante un error incluye el segmento interrumpido; consultar status y correlationId.
                VentaTiming.mark("salida_commit_serializacion");
                log.info("BE12 venta status={} total_ms={} etapas_ms={}",
                        completed ? response.getStatus() : 500, timing.totalMillis(), timing.stageMillis());
            }
        }
    }
}
