package uy.edu.ctc.pamahe.modules.auth.service;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import uy.edu.ctc.pamahe.modules.usuarios.model.Usuario;
import uy.edu.ctc.pamahe.modules.usuarios.repository.UsuarioRepository;

/** Adapta el usuario persistido al modelo que Spring Security utiliza para autenticar y autorizar. */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    public CustomUserDetailsService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Usuario usuario = this.usuarioRepository.findByUsernameAndActivoTrue(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado."));

        return User.builder()
                .username(usuario.getUsername())
                .password(usuario.getPasswordHash())
                .authorities(usuario.getRoles().stream()
                        .map(rol -> new SimpleGrantedAuthority("ROLE_" + rol.getNombre()))
                        .toList())
                .disabled(!usuario.getActivo())
                .build();
    }
}