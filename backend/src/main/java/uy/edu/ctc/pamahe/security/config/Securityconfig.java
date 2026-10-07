package uy.edu.ctc.pamahe.security.config;

import org.springframework.context.annotation.Bean;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import uy.edu.ctc.pamahe.security.filter.JwtAuthenticationFilter;
import uy.edu.ctc.pamahe.security.filter.PasswordRotationFilter;
import uy.edu.ctc.pamahe.security.handler.RestAccessDeniedHandler;
import uy.edu.ctc.pamahe.security.handler.RestAuthenticationEntryPoint;

/**
 * Define la frontera entre el catálogo público y la gestión interna.
 * La política combina autenticación JWT sin sesión con permisos por método y recurso, de modo que
 * los datos financieros y administrativos no dependan únicamente de restricciones del frontend.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class Securityconfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final UserDetailsService userDetailsService;
    private final RestAuthenticationEntryPoint authenticationEntryPoint;
    private final RestAccessDeniedHandler accessDeniedHandler;
    private final PasswordRotationFilter passwordRotationFilter;

    public Securityconfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                          UserDetailsService userDetailsService,
                          RestAuthenticationEntryPoint authenticationEntryPoint,
                          RestAccessDeniedHandler accessDeniedHandler,
                          PasswordRotationFilter passwordRotationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.userDetailsService = userDetailsService;
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.accessDeniedHandler = accessDeniedHandler;
        this.passwordRotationFilter = passwordRotationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, MonitoringAccess monitoringAccess) throws Exception {
        http.csrf(csrf -> csrf.disable())
                .cors(cors -> { })
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(this.authenticationEntryPoint)
                        .accessDeniedHandler(this.accessDeniedHandler))
                .authenticationProvider(this.authenticationProvider())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
                        .requestMatchers("/actuator/info", "/actuator/metrics", "/actuator/metrics/**")
                        .hasAnyRole("ADMINISTRADOR", "DUENO")
                        .requestMatchers(HttpMethod.GET, "/actuator/prometheus")
                        .access((authentication, context) -> new AuthorizationDecision(
                                monitoringAccess.allowed(context.getRequest())))
                        .requestMatchers("/actuator/**").denyAll()
                        
                        .requestMatchers(HttpMethod.POST, "/auth/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/auth/session-policy").permitAll()
                        .requestMatchers(HttpMethod.GET, "/catalogo/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/parametros/opciones").permitAll()
                        .requestMatchers(HttpMethod.POST, "/chatbot/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/uploads/public/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/solicitudes-venta/publica").permitAll()

                        .requestMatchers("/usuarios/**", "/roles/**", "/auditoria/**", "/parametros/**")
                        .hasAnyRole("ADMINISTRADOR", "DUENO")
                        .requestMatchers("/reportes/**", "/costos/**", "/exportaciones/**")
                        .hasAnyRole("ADMINISTRADOR", "DUENO")
                        .requestMatchers("/notificaciones/**")
                        .hasAnyRole("ADMINISTRADOR", "DUENO", "VENDEDOR")
                        .requestMatchers("/solicitudes-venta/**")
                        .hasAnyRole("ADMINISTRADOR", "DUENO", "VENDEDOR")

                        .requestMatchers(HttpMethod.GET, "/vehiculos/**")
                        .hasAnyRole("ADMINISTRADOR", "DUENO", "VENDEDOR", "TALLER")
                        .requestMatchers(HttpMethod.PATCH, "/vehiculos/*/estado")
                        .hasAnyRole("ADMINISTRADOR", "DUENO", "VENDEDOR", "TALLER")
                        .requestMatchers(HttpMethod.PATCH, "/vehiculos/*/publicacion")
                        .hasAnyRole("ADMINISTRADOR", "DUENO", "VENDEDOR")
                        .requestMatchers(HttpMethod.POST, "/vehiculos/**")
                        .hasAnyRole("ADMINISTRADOR", "DUENO", "VENDEDOR")
                        .requestMatchers(HttpMethod.PUT, "/vehiculos/**")
                        .hasAnyRole("ADMINISTRADOR", "DUENO", "VENDEDOR")
                        .requestMatchers(HttpMethod.DELETE, "/vehiculos/**")
                        .hasAnyRole("ADMINISTRADOR", "DUENO")

                        .requestMatchers(HttpMethod.GET, "/imagenes/**")
                        .hasAnyRole("ADMINISTRADOR", "DUENO", "VENDEDOR", "TALLER")
                        .requestMatchers(HttpMethod.POST, "/imagenes/**")
                        .hasAnyRole("ADMINISTRADOR", "DUENO", "VENDEDOR", "TALLER")
                        .requestMatchers(HttpMethod.PATCH, "/imagenes/**")
                        .hasAnyRole("ADMINISTRADOR", "DUENO", "VENDEDOR")
                        .requestMatchers(HttpMethod.DELETE, "/imagenes/**")
                        .hasAnyRole("ADMINISTRADOR", "DUENO")

                        .requestMatchers("/taller/**")
                        .hasAnyRole("ADMINISTRADOR", "DUENO", "TALLER")

                        .requestMatchers(HttpMethod.GET, "/compras/**")
                        .hasAnyRole("ADMINISTRADOR", "DUENO")
                        .requestMatchers(HttpMethod.POST, "/compras", "/compras/con-vehiculo")
                        .hasAnyRole("ADMINISTRADOR", "DUENO", "VENDEDOR")
                        .requestMatchers(HttpMethod.PATCH, "/compras/*/destino")
                        .hasAnyRole("ADMINISTRADOR", "DUENO", "VENDEDOR")
                        
                        .requestMatchers(HttpMethod.GET, "/ventas/*/detalle-gerencial")
                        .hasAnyRole("ADMINISTRADOR", "DUENO")
                        .requestMatchers(HttpMethod.POST, "/ventas/*/comprobante/reintentar")
                        .hasAnyRole("ADMINISTRADOR", "DUENO")
                        .requestMatchers("/ventas/**", "/clientes/**")
                        .hasAnyRole("ADMINISTRADOR", "DUENO", "VENDEDOR")

                        .anyRequest().authenticated())
                .addFilterBefore(this.jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(this.passwordRotationFilter, JwtAuthenticationFilter.class);

        return http.build();
    }
    
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(this.userDetailsService);
        provider.setPasswordEncoder(this.passwordEncoder());
        return provider;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }
}