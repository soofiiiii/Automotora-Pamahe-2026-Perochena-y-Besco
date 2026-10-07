package uy.edu.ctc.pamahe.modules.auth.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import uy.edu.ctc.pamahe.modules.usuarios.repository.UsuarioRepository;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {
    @Mock UsuarioRepository usuarioRepository;

    @Test
    void usuarioInactivoNoPuedeCargarseParaAutenticacion() {
        when(usuarioRepository.findByUsernameAndActivoTrue("inactivo")).thenReturn(Optional.empty());
        CustomUserDetailsService service = new CustomUserDetailsService(usuarioRepository);
        assertThrows(UsernameNotFoundException.class, () -> service.loadUserByUsername("inactivo"));
    }
}
