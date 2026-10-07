package uy.edu.ctc.pamahe.modules.usuarios.service;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import uy.edu.ctc.pamahe.common.exception.ResourceNotFoundException;
import uy.edu.ctc.pamahe.common.util.SecurityUtils;
import uy.edu.ctc.pamahe.modules.usuarios.model.Usuario;
import uy.edu.ctc.pamahe.modules.usuarios.repository.UsuarioRepository;

/**
 * Resuelve la cuenta autenticada y aplica una segunda verificación de roles en operaciones críticas.
 * Esta defensa complementa SecurityConfig y protege llamadas internas que no pasan directamente
 * por un controlador HTTP.
 */
@Service
public class UsuarioActualService {

    private final UsuarioRepository usuarioRepository;

    public UsuarioActualService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public Usuario obtenerActivo() {
        String username = SecurityUtils.usuarioAutenticado();
        return this.usuarioRepository.findByUsernameAndActivoTrue(username)
                .orElseThrow(() -> new ResourceNotFoundException("El usuario autenticado no existe o se encuentra inactivo."));
    }

    public Usuario exigirRoles(String... rolesPermitidos) {
        Usuario usuario = this.obtenerActivo();
        Set<String> roles = usuario.getRoles().stream()
                .map(rol -> rol.getNombre())
                .collect(Collectors.toSet());

        boolean autorizado = Arrays.stream(rolesPermitidos).anyMatch(roles::contains);
        if (!autorizado) {
            throw new AccessDeniedException("El usuario autenticado no posee un rol autorizado para esta operación.");
        }
        return usuario;
    }
}


