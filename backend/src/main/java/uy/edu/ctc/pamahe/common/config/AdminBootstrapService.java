package uy.edu.ctc.pamahe.common.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import uy.edu.ctc.pamahe.modules.usuarios.model.Usuario;
import uy.edu.ctc.pamahe.modules.usuarios.repository.UsuarioRepository;

/**
 * Inicializa de forma segura la credencial de la cuenta administrativa en producción.
 * La contraseña se toma exclusivamente de configuración externa y solo se aplica mientras la
 * cuenta tenga pendiente la rotación obligatoria. Después del primer cambio real, el secreto de
 * bootstrap puede retirarse del entorno sin impedir futuros arranques de la aplicación.
 */
@Component 
@Profile("prod")
public class AdminBootstrapService implements ApplicationRunner {
    
    private static final Logger LOGGER = LoggerFactory.getLogger(AdminBootstrapService.class);
    private static final int MIN_PASSWORD_LENGTH = 12;

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final String username;
    private final String bootstrapPassword;

    public AdminBootstrapService(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.bootstrap-admin.username:admin}") String username,
            @Value("${app.bootstrap-admin.password:}") String bootstrapPassword) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.username = normalizarUsername(username);
        this.bootstrapPassword = bootstrapPassword;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Usuario usuario = this.usuarioRepository.findByUsernameAndActivoTrue(this.username)
                .orElseThrow(() -> new IllegalStateException(
                        "La cuenta bootstrap administrativa configurada no existe o está inactiva."));

        boolean administrador = usuario.getRoles().stream()
                .anyMatch(rol -> "ADMINISTRADOR".equals(rol.getNombre()));
        if (!administrador) {
            throw new IllegalStateException("La cuenta bootstrap debe tener rol administrador.");
        }

        if (!Boolean.TRUE.equals(usuario.getDebeCambiarPassword())) {
            LOGGER.info("Bootstrap administrativo omitido: la cuenta {} ya completó la rotación inicial.", this.username);
            return;
        }

        validarPasswordBootstrap(this.bootstrapPassword, this.username);
        usuario.setPasswordHash(this.passwordEncoder.encode(this.bootstrapPassword));
        usuario.setDebeCambiarPassword(true);
        this.usuarioRepository.save(usuario);
        LOGGER.info("Credencial bootstrap actualizada para la cuenta administrativa {}. Se mantiene la rotación obligatoria.",
                this.username);
    }

    private static String normalizarUsername(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("BOOTSTRAP_ADMIN_USERNAME es obligatorio en producción.");
        }
        return value.trim().toLowerCase(java.util.Locale.ROOT);
    }

    private static void validarPasswordBootstrap(String password, String username) {
        if (password == null || password.isBlank()) {
            throw new IllegalStateException(
                    "BOOTSTRAP_ADMIN_PASSWORD es obligatorio mientras la cuenta inicial tenga rotación pendiente.");
        }
        if (password.length() < MIN_PASSWORD_LENGTH || password.length() > 72) {
            throw new IllegalStateException(
                    "BOOTSTRAP_ADMIN_PASSWORD debe tener entre 12 y 72 caracteres.");
        }
        if (password.equalsIgnoreCase(username)) {
            throw new IllegalStateException("BOOTSTRAP_ADMIN_PASSWORD no puede coincidir con el nombre de usuario.");
        }
    }
}
