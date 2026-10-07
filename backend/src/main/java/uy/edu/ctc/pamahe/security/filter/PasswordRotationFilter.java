package uy.edu.ctc.pamahe.security.filter;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import uy.edu.ctc.pamahe.modules.usuarios.repository.UsuarioRepository;
import uy.edu.ctc.pamahe.security.handler.SecurityErrorWriter;

/** Obliga a rotar contraseñas de bootstrap o restablecidas antes de operar. */
@Component
public class PasswordRotationFilter extends OncePerRequestFilter {

    private final UsuarioRepository usuarioRepository;
    private final SecurityErrorWriter errorWriter;

    public PasswordRotationFilter(UsuarioRepository usuarioRepository, SecurityErrorWriter errorWriter) {
        this.usuarioRepository = usuarioRepository;
        this.errorWriter = errorWriter;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication instanceof AnonymousAuthenticationToken || !authentication.isAuthenticated() || isAllowedPath(request.getRequestURI())) {
            filterChain.doFilter(request, response);
            return;
        }

        var usuario = usuarioRepository.findByUsernameAndActivoTrue(authentication.getName()).orElse(null);
        if (usuario != null && Boolean.TRUE.equals(usuario.getDebeCambiarPassword())) {
            errorWriter.write(
                    request,
                    response,
                    HttpStatus.FORBIDDEN.value(),
                    "PASSWORD_CHANGE_REQUIRED",
                    "Tenés que cambiar tu contraseña antes de continuar.",
                    new IllegalStateException("Password rotation required"));
            return;
        }
        filterChain.doFilter(request, response);
    }

    private boolean isAllowedPath(String uri) {
        return uri.endsWith("/auth/password")
                || uri.endsWith("/auth/me")
                || uri.endsWith("/auth/session-policy")
                || uri.contains("/catalogo/")
                || uri.contains("/uploads/public/")
                || uri.contains("/chatbot/")
                || uri.endsWith("/actuator/health");
    }
}
