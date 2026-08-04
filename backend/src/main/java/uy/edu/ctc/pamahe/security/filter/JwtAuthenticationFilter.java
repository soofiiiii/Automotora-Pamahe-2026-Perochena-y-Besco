package uy.edu.ctc.pamahe.security.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import uy.edu.ctc.pamahe.security.exception.JwtAuthenticationException;
import uy.edu.ctc.pamahe.security.handler.RestAuthenticationEntryPoint;
import uy.edu.ctc.pamahe.security.jwt.JwtService;

import java.io.IOException;

/**
 * Traduce un JWT válido al contexto de seguridad de la solicitud.
 * El usuario y sus roles se vuelven a consultar para que una desactivación o cambio de permisos
 * tenga efecto sin esperar al vencimiento del token emitido anteriormente.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final RestAuthenticationEntryPoint authenticationEntryPoint;

    public JwtAuthenticationFilter(JwtService jwtService,
                                   UserDetailsService userDetailsService,
                                   RestAuthenticationEntryPoint authenticationEntryPoint) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.authenticationEntryPoint = authenticationEntryPoint;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            // Las rutas públicas continúan; las privadas serán rechazadas luego por la cadena de seguridad.
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String token = authHeader.substring(7);
            String username = this.jwtService.obtenerUsername(token);

            // No se reemplaza una autenticación ya resuelta por otro mecanismo dentro de la misma solicitud.
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);

                if (this.jwtService.tokenValido(token, userDetails)) {
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }

            filterChain.doFilter(request, response);
        } catch (ExpiredJwtException exception) {
            SecurityContextHolder.clearContext();
            this.authenticationEntryPoint.commence(
                    request,
                    response,
                    new JwtAuthenticationException("AUTH_TOKEN_EXPIRED", "El token de acceso está vencido.", exception)
            );
        } catch (JwtException | IllegalArgumentException exception) {
            SecurityContextHolder.clearContext();
            this.authenticationEntryPoint.commence(
                    request,
                    response,
                    new JwtAuthenticationException("AUTH_TOKEN_INVALID", "El token de acceso es inválido.", exception)
            );
        } catch (AuthenticationException exception) {
            SecurityContextHolder.clearContext();
            this.authenticationEntryPoint.commence(
                    request,
                    response,
                    new JwtAuthenticationException(
                            "AUTH_TOKEN_USER_INVALID",
                            "El usuario asociado al token no existe o se encuentra inactivo.",
                            exception
                    )
            );
        }
    }
}
