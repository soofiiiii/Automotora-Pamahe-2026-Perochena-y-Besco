package uy.edu.ctc.pamahe.modules.auth.service;

import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.common.exception.ResourceNotFoundException;
import uy.edu.ctc.pamahe.modules.auditoria.service.AuditoriaService;
import uy.edu.ctc.pamahe.modules.auth.dto.request.CambiarPasswordRequest;
import uy.edu.ctc.pamahe.modules.auth.dto.request.LoginRequest;
import uy.edu.ctc.pamahe.modules.auth.dto.response.LoginResponse;
import uy.edu.ctc.pamahe.modules.auth.dto.response.AuthSessionPolicyResponse;
import uy.edu.ctc.pamahe.modules.usuarios.model.Usuario;
import uy.edu.ctc.pamahe.modules.usuarios.repository.UsuarioRepository;
import uy.edu.ctc.pamahe.modules.usuarios.service.UsuarioActualService;
import uy.edu.ctc.pamahe.security.jwt.JwtService;

/**
 * Coordina la validación de credenciales y la emisión del token sin implementar autenticación 
 * manual, delegando la comparación segura de contraseñas al proveedor configurado en Spring.
 */
@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;
    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioActualService usuarioActualService;
    private final PasswordEncoder passwordEncoder;
    private final AuditoriaService auditoriaService;
    private final LoginAttemptService loginAttemptService;

    @Value("${security.jwt.renewal-mode:REAUTHENTICATE}")
    private String renewalMode;

    @Value("${security.jwt.refresh-enabled:false}")
    private boolean refreshEnabled;

    public AuthService(AuthenticationManager authenticationManager,
            CustomUserDetailsService userDetailsService,
            JwtService jwtService,
            UsuarioRepository usuarioRepository,
            UsuarioActualService usuarioActualService,
            PasswordEncoder passwordEncoder,
            AuditoriaService auditoriaService,
            LoginAttemptService loginAttemptService) {
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.jwtService = jwtService;
        this.usuarioRepository = usuarioRepository;
        this.usuarioActualService = usuarioActualService;
        this.passwordEncoder = passwordEncoder;
        this.auditoriaService = auditoriaService;
        this.loginAttemptService = loginAttemptService;
    }

    @PostConstruct
    void validarPoliticaSesion() {
        if (!"REAUTHENTICATE".equalsIgnoreCase(this.renewalMode) || this.refreshEnabled) {
            throw new IllegalStateException(
                    "Configuración de sesión inválida: Pamahe usa REAUTHENTICATE y no implementa refresh token.");
        }
    }

    public LoginResponse login(LoginRequest request, String clientIp) {
        String username = request.username().trim().toLowerCase(java.util.Locale.ROOT);
        this.loginAttemptService.assertAllowed(username, clientIp);
        try {
            this.authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, request.password()));
            this.loginAttemptService.recordSuccess(username);
        } catch (AuthenticationException exception) {
            this.loginAttemptService.recordFailure(username, clientIp);
            throw exception;
        }

        UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);
        Usuario usuario = this.usuarioRepository.findByUsernameAndActivoTrue(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado."));

        String token = this.jwtService.generarToken(userDetails);
        return new LoginResponse(
                token,
                usuario.getUsername(),
                usuario.getNombre(),
                usuario.getRoles().stream().map(rol -> rol.getNombre()).collect(Collectors.toSet()),
                usuario.getDebeCambiarPassword());
    }

    public AuthSessionPolicyResponse sessionPolicy() {
        return new AuthSessionPolicyResponse(
                this.renewalMode.toUpperCase(java.util.Locale.ROOT),
                this.jwtService.getExpirationMinutes(),
                this.refreshEnabled);
    }

    @Transactional
    public void cambiarPasswordPropia(CambiarPasswordRequest request) {
        Usuario usuario = this.usuarioActualService.obtenerActivo();
        if (!this.passwordEncoder.matches(request.passwordActual(), usuario.getPasswordHash())) {
            throw new BusinessException("La contraseña actual no es correcta.");
        }
        if (this.passwordEncoder.matches(request.nuevaPassword(), usuario.getPasswordHash())) {
            throw new BusinessException("La nueva contraseña debe ser diferente de la actual.");
        }
        usuario.setPasswordHash(this.passwordEncoder.encode(request.nuevaPassword()));
        usuario.setDebeCambiarPassword(false);
        this.usuarioRepository.save(usuario);
        this.auditoriaService.registrar("CAMBIO_PASSWORD", "Usuario", usuario.getId(), "Cambio de contraseña propia");
    }
}
