package uy.edu.ctc.pamahe.common.config;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import uy.edu.ctc.pamahe.modules.roles.model.Rol;
import uy.edu.ctc.pamahe.modules.usuarios.model.Usuario;
import uy.edu.ctc.pamahe.modules.usuarios.repository.UsuarioRepository;

@ExtendWith(MockitoExtension.class)
class AdminBootstrapServiceTest {

    @Mock UsuarioRepository usuarios;
    @Mock PasswordEncoder encoder;

    @Test
    void noExigeSecretoCuandoLaRotacionYaFueCompletada() {
        Usuario admin = admin(false);
        when(usuarios.findByUsernameAndActivoTrue("admin")).thenReturn(Optional.of(admin));
        AdminBootstrapService service = new AdminBootstrapService(usuarios, encoder, "admin", "");

        assertDoesNotThrow(() -> service.run(null));
        verify(usuarios, never()).save(any());
    }

    @Test
    void exigeSecretoMientrasLaRotacionEstaPendiente() {
        when(usuarios.findByUsernameAndActivoTrue("admin")).thenReturn(Optional.of(admin(true)));
        AdminBootstrapService service = new AdminBootstrapService(usuarios, encoder, "admin", "");
        assertThrows(IllegalStateException.class, () -> service.run(null));
    }

    @Test
    void rechazaCuentaBootstrapSinRolAdministrador() {
        Usuario usuario = new Usuario();
        usuario.setUsername("admin");
        usuario.setDebeCambiarPassword(true);
        Rol vendedor = new Rol();
        vendedor.setNombre("VENDEDOR");
        usuario.setRoles(Set.of(vendedor));
        when(usuarios.findByUsernameAndActivoTrue("admin")).thenReturn(Optional.of(usuario));

        AdminBootstrapService service = new AdminBootstrapService(usuarios, encoder, "admin", "ClaveTemporal123!");
        assertThrows(IllegalStateException.class, () -> service.run(null));
    }

    @Test
    void actualizaHashSinQuitarLaRotacionObligatoria() {
        Usuario admin = admin(true);
        when(usuarios.findByUsernameAndActivoTrue("admin")).thenReturn(Optional.of(admin));
        when(encoder.encode("ClaveTemporal123!")).thenReturn("hash-nuevo");
        AdminBootstrapService service = new AdminBootstrapService(usuarios, encoder, "admin", "ClaveTemporal123!");

        service.run(null);

        verify(usuarios).save(admin);
        org.junit.jupiter.api.Assertions.assertEquals("hash-nuevo", admin.getPasswordHash());
        org.junit.jupiter.api.Assertions.assertTrue(admin.getDebeCambiarPassword());
    }

    private Usuario admin(boolean pendiente) {
        Usuario usuario = new Usuario();
        usuario.setUsername("admin");
        usuario.setDebeCambiarPassword(pendiente);
        Rol rol = new Rol();
        rol.setNombre("ADMINISTRADOR");
        usuario.setRoles(Set.of(rol));
        return usuario;
    }
}
