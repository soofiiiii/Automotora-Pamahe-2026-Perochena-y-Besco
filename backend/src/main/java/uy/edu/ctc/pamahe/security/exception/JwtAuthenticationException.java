package uy.edu.ctc.pamahe.security.exception;

import org.springframework.security.core.AuthenticationException;

public class JwtAuthenticationException extends AuthenticationException {

    private final String codigo;

    public JwtAuthenticationException(String codigo, String mensaje, Throwable cause) {
        super(mensaje, cause);
        this.codigo = codigo;
    }

    public String getCodigo() {
        return this.codigo;
    }
}