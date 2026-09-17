package uy.edu.ctc.pamahe.security.handler;

import org.springframework.http.MediaType;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import tools.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import uy.edu.ctc.pamahe.common.response.ApiErrorResponse;

/**
 * Mantiene los errores de Spring Security con el mismo contrato JSON que el resto de la API.
 * Esto evita respuestas HTML y conserva un identificador técnico sin exponer detalles sensibles.
 */
@Component
public class SecurityErrorWriter {

    private static final Logger LOGGER = LoggerFactory.getLogger(SecurityErrorWriter.class);

    private final ObjectMapper objectMapper;

    public SecurityErrorWriter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public void write(HttpServletRequest request,
                      HttpServletResponse response,
                      int status,
                      String codigo,
                      String mensaje,
                      Throwable exception) throws IOException {
        String incidenteId = org.slf4j.MDC.get(uy.edu.ctc.pamahe.common.filter.CorrelationIdFilter.MDC_KEY);
        if (incidenteId == null || incidenteId.isBlank()) {
            incidenteId = UUID.randomUUID().toString();
        }
        LOGGER.warn("Incidente de seguridad {} - {} {} - {}", incidenteId, request.getMethod(), request.getRequestURI(), mensaje, exception);

        response.setStatus(status);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        this.objectMapper.writeValue(
                response.getOutputStream(),
                ApiErrorResponse.of(codigo, mensaje, request.getRequestURI(), incidenteId, null)
        );
    }
}
