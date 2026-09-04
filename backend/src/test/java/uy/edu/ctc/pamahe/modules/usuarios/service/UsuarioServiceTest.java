package uy.edu.ctc.pamahe.modules.usuarios.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.modules.auditoria.service.AuditoriaService;
import uy.edu.ctc.pamahe.modules.roles.model.Rol;
import uy.edu.ctc.pamahe.modules.roles.repository.RolRepository;
import uy.edu.ctc.pamahe.modules.usuarios.dto.request.UsuarioRequest;
import uy.edu.ctc.pamahe.modules.usuarios.model.Usuario;
import uy.edu.ctc.pamahe.modules.usuarios.repository.UsuarioRepository;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {
    @Mock
    UsuarioRepository usuarioRepository;
    @Mock
    RolRepository rolRepository;
    @Mock
    PasswordEncoder passwordEncoder;
    @Mock
    AuditoriaService auditoriaService;
    @Mock
    UsuarioActualService usuarioActualService;
    private UsuarioService service;

    @BeforeEach
    void setUp() {
        service = new UsuarioService(usuarioRepository, rolRepository, passwordEncoder, auditoriaService,
                usuarioActualService);
    }

    @Test
    void normalizaUsernameYEmailAntesDeValidarYGuardar() {
        Rol vendedor = rol("VENDEDOR");
        when(rolRepository.findByNombre("VENDEDOR")).thenReturn(Optional.of(vendedor));
        when(passwordEncoder.encode("Password123")).thenReturn("hash");
        when(usuarioRepository.save(any())).thenAnswer(inv -> {
            Usuario u = inv.getArgument(0);
            u.setId(10L);
            return u;
        });
        service.crear(new UsuarioRequest("  FABi  ", "Password123", "Fabi", "  FABI@EXAMPLE.COM ", null,
                Set.of(" vendedor ")));
        verify(usuarioRepository).existsByUsername("fabi");
        verify(usuarioRepository).existsByEmail("fabi@example.com");
        verify(usuarioRepository)
                .save(argThat(u -> "fabi".equals(u.getUsername()) && "fabi@example.com".equals(u.getEmail())));
    }

    @Test
    void noPermiteAutoDesactivacion() {
        Usuario actual = usuarioAdmin(1L);
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(actual));
        when(usuarioActualService.obtenerActivo()).thenReturn(actual);
        assertThrows(BusinessException.class, () -> service.desactivar(1L));
    }

    @Test
    void noPermiteDesactivarUltimoAdministrador() {
        Usuario objetivo = usuarioAdmin(1L);
        Usuario actual = usuarioAdmin(2L);
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(objetivo));
        when(usuarioActualService.obtenerActivo()).thenReturn(actual);
        when(usuarioRepository.contarAdministradoresActivos()).thenReturn(1L);
        assertThrows(BusinessException.class, () -> service.desactivar(1L));
    }

    private Rol rol(String n) {
        Rol r = new Rol();
        r.setNombre(n);
        return r;
    }

    private Usuario usuarioAdmin(Long id) {
        Usuario u = new Usuario();
        u.setId(id);
        u.setNombre("Admin");
        u.setRoles(Set.of(rol("ADMINISTRADOR")));
        return u;
    }
}
