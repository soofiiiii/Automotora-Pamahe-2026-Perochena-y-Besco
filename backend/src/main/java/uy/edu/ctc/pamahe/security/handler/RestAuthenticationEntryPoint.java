package uy.edu.ctc.pamahe.security.handler;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Component;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import uy.edu.ctc.pamahe.security.exception.JwtAuthenticationException;

@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final SecurityErrorWriter errorWriter;

    public RestAuthenticationEntryPoint(SecurityErrorWriter errorWriter) {
        this.errorWriter = errorWriter;
    }

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException, ServletException {
        String codigo = "AUTH_REQUIRED";
        String mensaje = "Debes autenticarte para acceder a este recurso.";

        if (authException instanceof JwtAuthenticationException jwtException) {
            codigo = jwtException.getCodigo();
            mensaje = jwtException.getMessage();
        }

        this.errorWriter.write(request, response, HttpStatus.UNAUTHORIZED.value(), codigo, mensaje, authException);
    }
}
