package uy.edu.ctc.pamahe.modules.auth.service;

import java.util.stream.Collectors;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import uy.edu.ctc.pamahe.common.exception.ResourceNotFoundException;
import uy.edu.ctc.pamahe.modules.auth.dto.request.LoginRequest;
import uy.edu.ctc.pamahe.modules.auth.dto.response.LoginResponse;
import uy.edu.ctc.pamahe.modules.usuarios.model.Usuario;
import uy.edu.ctc.pamahe.modules.usuarios.repository.UsuarioRepository;
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

    public AuthService(AuthenticationManager authenticationManager,
                       CustomUserDetailsService userDetailsService,
                       JwtService jwtService,
                       UsuarioRepository usuarioRepository) {
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.jwtService = jwtService;
        this.usuarioRepository = usuarioRepository;
    }

    public LoginResponse login(LoginRequest request) {
        // La normalización evita identidades duplicadas por diferencias de mayúsculas o espacios.
        String username = request.username().trim().toLowerCase();
        this.authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, request.password())
        );

        UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);
        Usuario usuario = this.usuarioRepository.findByUsernameAndActivoTrue(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado."));

        String token = this.jwtService.generarToken(userDetails);
        return new LoginResponse(
                token,
                usuario.getUsername(),
                usuario.getNombre(),
                usuario.getRoles().stream().map(rol -> rol.getNombre()).collect(Collectors.toSet())
        );
    }
}
