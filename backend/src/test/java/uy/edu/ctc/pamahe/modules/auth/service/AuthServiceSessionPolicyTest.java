package uy.edu.ctc.pamahe.modules.auth.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import uy.edu.ctc.pamahe.modules.auditoria.service.AuditoriaService;
import uy.edu.ctc.pamahe.modules.usuarios.repository.UsuarioRepository;
import uy.edu.ctc.pamahe.modules.usuarios.service.UsuarioActualService;
import uy.edu.ctc.pamahe.security.jwt.JwtService;

@ExtendWith(MockitoExtension.class)
class AuthServiceSessionPolicyTest {

    @Mock AuthenticationManager authenticationManager;
    @Mock CustomUserDetailsService userDetailsService;
    @Mock JwtService jwtService;
    @Mock UsuarioRepository usuarioRepository;
    @Mock UsuarioActualService usuarioActualService;
    @Mock PasswordEncoder passwordEncoder;
    @Mock AuditoriaService auditoriaService;
    @Mock LoginAttemptService loginAttemptService;

    private AuthService service;

    @BeforeEach
    void setUp() {
        service = new AuthService(authenticationManager, userDetailsService, jwtService, usuarioRepository,
                usuarioActualService, passwordEncoder, auditoriaService, loginAttemptService);
    }

    @Test
    void publicaContratoDeReautenticacionSinRefresh() {
        ReflectionTestUtils.setField(service, "renewalMode", "REAUTHENTICATE");
        ReflectionTestUtils.setField(service, "refreshEnabled", false);
        when(jwtService.getExpirationMinutes()).thenReturn(120L);

        var policy = service.sessionPolicy();

        assertEquals("REAUTHENTICATE", policy.renewalMode());
        assertEquals(120L, policy.accessTokenMinutes());
        assertFalse(policy.refreshTokenEnabled());
    }

    @Test
    void rechazaConfiguracionQuePrometeRefreshNoImplementado() {
        ReflectionTestUtils.setField(service, "renewalMode", "REFRESH");
        ReflectionTestUtils.setField(service, "refreshEnabled", true);
        assertThrows(IllegalStateException.class, service::validarPoliticaSesion);
    }
}
