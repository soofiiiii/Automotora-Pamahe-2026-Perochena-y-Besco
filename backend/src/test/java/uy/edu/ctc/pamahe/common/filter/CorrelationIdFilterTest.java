package uy.edu.ctc.pamahe.common.filter;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class CorrelationIdFilterTest {
    @Test
    void limpiaMdcInclusoSiLaCadenaFalla() {
        var request = new MockHttpServletRequest();
        var response = new MockHttpServletResponse();
        request.addHeader(CorrelationIdFilter.HEADER, "correlation-test-001");
        assertThrows(IllegalStateException.class, () -> new CorrelationIdFilter().doFilter(request, response, (req, res) -> {
            assertEquals("correlation-test-001", MDC.get(CorrelationIdFilter.MDC_KEY));
            throw new IllegalStateException("fixture");
        }));
        assertNull(MDC.get(CorrelationIdFilter.MDC_KEY));
        assertEquals("correlation-test-001", response.getHeader(CorrelationIdFilter.HEADER));
    }

    @Test
    void reemplazaIdentificadorConCaracteresNoSeguros() throws Exception {
        var request = new MockHttpServletRequest();
        var response = new MockHttpServletResponse();
        request.addHeader(CorrelationIdFilter.HEADER, "entrada con espacios");
        new CorrelationIdFilter().doFilter(request, response, (req, res) -> {});
        assertNotEquals("entrada con espacios", response.getHeader(CorrelationIdFilter.HEADER));
        assertDoesNotThrow(() -> java.util.UUID.fromString(response.getHeader(CorrelationIdFilter.HEADER)));
        assertNull(MDC.get(CorrelationIdFilter.MDC_KEY));
    }
}
