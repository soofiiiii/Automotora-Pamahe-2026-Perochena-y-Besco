package uy.edu.ctc.pamahe.modules.auth.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

import uy.edu.ctc.pamahe.common.exception.RateLimitExceededException;

class LoginAttemptServiceTest {

    @Test
    void bloqueaUsuarioAlSuperarUmbral() {
        LoginAttemptService service = new LoginAttemptService(2, 50, 300, 60);
        service.recordFailure("admin", "10.0.0.1");
        service.recordFailure("admin", "10.0.0.2");
        assertThrows(RateLimitExceededException.class, () -> service.assertAllowed("admin", "10.0.0.3"));
    }

    @Test
    void bloqueaIpAunqueCambieUsuario() {
        LoginAttemptService service = new LoginAttemptService(50, 2, 300, 60);
        service.recordFailure("a", "10.0.0.1");
        service.recordFailure("b", "10.0.0.1");
        assertThrows(RateLimitExceededException.class, () -> service.assertAllowed("c", "10.0.0.1"));
    }

    @Test
    void exitoLimpiaContadorDelUsuario() {
        LoginAttemptService service = new LoginAttemptService(2, 50, 300, 60);
        service.recordFailure("admin", "10.0.0.1");
        service.recordSuccess("admin");
        assertDoesNotThrow(() -> service.assertAllowed("admin", "10.0.0.2"));
    }

    @Test
    void usuariosDistintosNoCompartenBloqueo() {
        LoginAttemptService service = new LoginAttemptService(2, 50, 300, 60);
        service.recordFailure("admin", "10.0.0.1");
        service.recordFailure("admin", "10.0.0.2");
        assertDoesNotThrow(() -> service.assertAllowed("vendedor", "10.0.0.3"));
    }
}
