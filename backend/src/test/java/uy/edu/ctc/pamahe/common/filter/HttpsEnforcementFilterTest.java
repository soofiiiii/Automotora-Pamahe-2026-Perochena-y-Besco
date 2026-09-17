package uy.edu.ctc.pamahe.common.filter;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import jakarta.servlet.FilterChain;
import uy.edu.ctc.pamahe.security.handler.SecurityErrorWriter;

@ExtendWith(MockitoExtension.class)
class HttpsEnforcementFilterTest {

    @Mock SecurityErrorWriter errorWriter;
    @Mock FilterChain chain;

    @Test
    void permiteRequestMarcadoComoSeguro() throws Exception {
        var request = new MockHttpServletRequest("GET", "/api/actuator/health");
        request.setSecure(true);
        var response = new MockHttpServletResponse();
        new HttpsEnforcementFilter(errorWriter).doFilter(request, response, chain);
        verify(chain).doFilter(request, response);
        verify(errorWriter, never()).write(any(), any(), anyInt(), any(), any(), any());
    }

    @Test
    void permiteHttpsReenviadoPorProxy() throws Exception {
        var request = new MockHttpServletRequest("GET", "/api/actuator/health");
        request.addHeader("X-Forwarded-Proto", "https");
        request.setRemoteAddr("127.0.0.1");
        var response = new MockHttpServletResponse();
        new HttpsEnforcementFilter(errorWriter).doFilter(request, response, chain);
        verify(chain).doFilter(request, response);
    }

    @Test
    void noConfiaEnForwardedProtoDesdeOrigenNoLocal() throws Exception {
        var request = new MockHttpServletRequest("GET", "/api/actuator/health");
        request.addHeader("X-Forwarded-Proto", "https");
        request.setRemoteAddr("203.0.113.20");
        var response = new MockHttpServletResponse();
        new HttpsEnforcementFilter(errorWriter).doFilter(request, response, chain);
        verify(chain, never()).doFilter(any(), any());
        verify(errorWriter).write(eq(request), eq(response), eq(HttpStatus.UPGRADE_REQUIRED.value()),
                eq("HTTPS_REQUIRED"), any(), any());
    }

    @Test
    void rechazaHttpEnProduccion() throws Exception {
        var request = new MockHttpServletRequest("POST", "/api/auth/login");
        var response = new MockHttpServletResponse();
        new HttpsEnforcementFilter(errorWriter).doFilter(request, response, chain);
        verify(chain, never()).doFilter(any(), any());
        verify(errorWriter).write(eq(request), eq(response), eq(HttpStatus.UPGRADE_REQUIRED.value()),
                eq("HTTPS_REQUIRED"), any(), any());
    }
}
