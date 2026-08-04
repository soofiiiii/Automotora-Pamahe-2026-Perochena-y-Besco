package uy.edu.ctc.pamahe.common.util;

import java.util.Arrays;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Centraliza la lectura del contexto de Spring Security para no replicar criterios de autenticación
 * y nombres de roles en los servicios de negocio.
 */
public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static String usuarioActual() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!estaAutenticado(authentication)) {
            return "sistema";
        }
        return authentication.getName();
    }

    public static String usuarioAutenticado() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!estaAutenticado(authentication)) {
            throw new AuthenticationCredentialsNotFoundException("No existe un usuario autenticado.");
        }
        return authentication.getName();
    }

    public static boolean tieneAlgunRol(String... roles) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!estaAutenticado(authentication)) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> Arrays.stream(roles)
                        .anyMatch(role -> authority.getAuthority().equals("ROLE_" + role)));
    }

    private static boolean estaAutenticado(Authentication authentication) {
        return authentication != null
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken);
    }
}
