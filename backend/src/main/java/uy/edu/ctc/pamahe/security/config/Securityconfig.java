package uy.edu.ctc.pamahe.security.config;

import org.springframework.context.annotation.Bean;
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
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final UserDetailsService userDetailsService;
    private final RestAuthenticationEntryPoint authenticationEntryPoint;
    private final RestAccessDeniedHandler accessDeniedHandler;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                          UserDetailsService userDetailsService,
                          RestAuthenticationEntryPoint authenticationEntryPoint,
                          RestAccessDeniedHandler accessDeniedHandler) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.userDetailsService = userDetailsService;
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.accessDeniedHandler = accessDeniedHandler;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
         // La API no mantiene sesión de servidor; cada solicitud privada debe acreditar su JWT.
        http.csrf(csrf -> csrf.disable())
                .cors(cors -> { })
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(this.authenticationEntryPoint)
                        .accessDeniedHandler(this.accessDeniedHandler)
                )
                .authenticationProvider(this.authenticationProvider())
                .authorizeHttpRequests(auth -> auth
                        // Solo se liberan las superficies necesarias para operación pública y monitoreo.
                        .requestMatchers("/actuator/health").permitAll()
                        .requestMatchers(HttpMethod.POST, "/auth/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/catalogo/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/chatbot/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/uploads/public/**").permitAll()

                        // Administración, auditoría, costos y reportes contienen información interna sensible.
                        .requestMatchers("/usuarios/**", "/roles/**", "/auditoria/**", "/parametros/**")
                        .hasAnyRole("ADMINISTRADOR", "DUENO")
                        .requestMatchers("/reportes/**", "/costos/**", "/exportaciones/**")
                        .hasAnyRole("ADMINISTRADOR", "DUENO")

                        // Los permisos de vehículos se separan por operación para respetar responsabilidades reales.
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
                        .requestMatchers(HttpMethod.GET, "/ventas/*/detalle-gerencial")
                        .hasAnyRole("ADMINISTRADOR", "DUENO")
                        .requestMatchers("/compras/**", "/ventas/**", "/clientes/**")
                        .hasAnyRole("ADMINISTRADOR", "DUENO", "VENDEDOR")

                        .anyRequest().authenticated()
                )
                // El JWT debe poblar el contexto antes de que Spring evalúe las reglas anteriores.
                .addFilterBefore(this.jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

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