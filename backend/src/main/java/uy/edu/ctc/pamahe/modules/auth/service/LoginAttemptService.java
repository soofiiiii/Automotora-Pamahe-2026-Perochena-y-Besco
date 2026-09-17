package uy.edu.ctc.pamahe.modules.auth.service;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import uy.edu.ctc.pamahe.common.exception.RateLimitExceededException;

/**
 * Protección en memoria para una instancia de la API. En producción se complementa
 * con el rate limiting del reverse proxy para cubrir múltiples procesos/nodos.
 */
@Service
public class LoginAttemptService {

    private static final Logger LOGGER = LoggerFactory.getLogger(LoginAttemptService.class);

    private final ConcurrentHashMap<String, AttemptState> userAttempts = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, AttemptState> ipAttempts = new ConcurrentHashMap<>();

    private final int maxUserAttempts;
    private final int maxIpAttempts;
    private final Duration window;
    private final Duration blockDuration;

    public LoginAttemptService(
            @Value("${app.security.login-rate-limit.max-attempts-user:5}") int maxUserAttempts,
            @Value("${app.security.login-rate-limit.max-attempts-ip:20}") int maxIpAttempts,
            @Value("${app.security.login-rate-limit.window-seconds:300}") long windowSeconds,
            @Value("${app.security.login-rate-limit.block-seconds:900}") long blockSeconds) {
        this.maxUserAttempts = maxUserAttempts;
        this.maxIpAttempts = maxIpAttempts;
        this.window = Duration.ofSeconds(windowSeconds);
        this.blockDuration = Duration.ofSeconds(blockSeconds);
    }

    public void assertAllowed(String username, String ip) {
        Instant now = Instant.now();
        assertAllowed(userAttempts, normalizeUser(username), now);
        assertAllowed(ipAttempts, normalizeIp(ip), now);
    }

    public void recordFailure(String username, String ip) {
        Instant now = Instant.now();
        recordFailure(userAttempts, normalizeUser(username), maxUserAttempts, now);
        recordFailure(ipAttempts, normalizeIp(ip), maxIpAttempts, now);
    }

    public void recordSuccess(String username) {
        userAttempts.remove(normalizeUser(username));
    }

    private void assertAllowed(ConcurrentHashMap<String, AttemptState> store, String key, Instant now) {
        AttemptState state = store.get(key);
        if (state == null) {
            return;
        }
        synchronized (state) {
            resetExpiredWindow(state, now);
            if (state.blockedUntil != null && now.isBefore(state.blockedUntil)) {
                long retry = Duration.between(now, state.blockedUntil).toSeconds() + 1;
                throw new RateLimitExceededException(
                        "Se alcanzó el límite temporal de intentos de inicio de sesión.", retry);
            }
        }
    }

    private void recordFailure(ConcurrentHashMap<String, AttemptState> store, String key, int threshold, Instant now) {
        AttemptState state = store.computeIfAbsent(key, ignored -> new AttemptState(now));
        synchronized (state) {
            resetExpiredWindow(state, now);
            state.failures++;
            if (state.failures >= threshold) {
                state.blockedUntil = now.plus(blockDuration);
                LOGGER.warn("Bloqueo temporal de autenticación aplicado a clave {} tras {} fallos.", key, state.failures);
            }
        }
    }

    private void resetExpiredWindow(AttemptState state, Instant now) {
        if (Duration.between(state.windowStarted, now).compareTo(window) >= 0) {
            state.windowStarted = now;
            state.failures = 0;
            if (state.blockedUntil != null && !now.isBefore(state.blockedUntil)) {
                state.blockedUntil = null;
            }
        }
        if (state.blockedUntil != null && !now.isBefore(state.blockedUntil)) {
            state.blockedUntil = null;
            state.failures = 0;
            state.windowStarted = now;
        }
    }

    private String normalizeUser(String username) {
        return username == null ? "<empty>" : username.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeIp(String ip) {
        return ip == null || ip.isBlank() ? "unknown" : ip.trim();
    }

    private static final class AttemptState {
        private Instant windowStarted;
        private int failures;
        private Instant blockedUntil;

        private AttemptState(Instant windowStarted) {
            this.windowStarted = windowStarted;
        }
    }
}
