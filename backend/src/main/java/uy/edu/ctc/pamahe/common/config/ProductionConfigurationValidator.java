package uy.edu.ctc.pamahe.common.config;

import java.net.URI;
import java.nio.file.Path;
import java.util.Base64;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

/** Rechaza configuraciones de producción incompletas, contradictorias o inseguras. */
@Component
@Profile("prod")
public class ProductionConfigurationValidator {

    private final String dbUrl;
    private final String dbUser;
    private final String dbPassword;
    private final String jwtSecret;
    private final String frontendOrigins;
    private final String storageRoot;
    private final String renewalMode;
    private final boolean refreshEnabled;

    @Value("${server.address:127.0.0.1}")
    private String serverAddress = "127.0.0.1";

    @Value("${server.forward-headers-strategy:none}")
    private String forwardHeadersStrategy = "none";

    public ProductionConfigurationValidator(
            @Value("${spring.datasource.url}") String dbUrl,
            @Value("${spring.datasource.username}") String dbUser,
            @Value("${spring.datasource.password}") String dbPassword,
            @Value("${security.jwt.secret}") String jwtSecret,
            @Value("${app.cors.allowed-origins}") String frontendOrigins,
            @Value("${app.storage.root}") String storageRoot,
            @Value("${security.jwt.renewal-mode:REAUTHENTICATE}") String renewalMode,
            @Value("${security.jwt.refresh-enabled:false}") boolean refreshEnabled) {
        this.dbUrl = dbUrl;
        this.dbUser = dbUser;
        this.dbPassword = dbPassword;
        this.jwtSecret = jwtSecret;
        this.frontendOrigins = frontendOrigins;
        this.storageRoot = storageRoot;
        this.renewalMode = renewalMode;
        this.refreshEnabled = refreshEnabled;
    }

    @PostConstruct
    public void validate() {
        validarProxy();
        validarBaseDeDatos();
        validarJwt();
        validarCors();
        validarStorage();
        validarPoliticaSesion();
    }

    private void validarBaseDeDatos() {
        if (isBlank(this.dbUrl) || !this.dbUrl.startsWith("jdbc:mysql://")) {
            throw new IllegalStateException("DB_URL debe ser una URL JDBC MySQL explícita en producción.");
        }
        if (isBlank(this.dbUser)) {
            throw new IllegalStateException("DB_USER es obligatorio en producción.");
        }
        if (isBlank(this.dbPassword)) {
            throw new IllegalStateException("DB_PASSWORD es obligatorio en producción.");
        }
    }

    private void validarJwt() {
        if (isBlank(this.jwtSecret)) {
            throw new IllegalStateException("JWT_SECRET es obligatorio en producción.");
        }
        try {
            byte[] decoded = Base64.getDecoder().decode(this.jwtSecret.trim());
            if (decoded.length < 32) {
                throw new IllegalStateException("JWT_SECRET debe contener al menos 256 bits reales de entropía en Base64.");
            }
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException("JWT_SECRET debe estar codificado en Base64 válido.", exception);
        }
    }

    private void validarCors() {
        if (isBlank(this.frontendOrigins)) {
            throw new IllegalStateException("FRONTEND_URL es obligatorio en producción.");
        }
        for (String origin : this.frontendOrigins.split(",", -1)) {
            try {
                URI uri = URI.create(origin.trim());
                String host = uri.getHost();
                if (!"https".equalsIgnoreCase(uri.getScheme()) || host == null
                        || host.equalsIgnoreCase("localhost") || host.startsWith("127.")
                        || host.equals("[::1]") || host.equals("0.0.0.0")
                        || uri.getUserInfo() != null || uri.getRawQuery() != null || uri.getFragment() != null
                        || (uri.getRawPath() != null && !uri.getRawPath().isEmpty())
                        || uri.getPort() == 0 || uri.getPort() > 65535) {
                    throw new IllegalArgumentException("Origen inválido");
                }
            } catch (IllegalArgumentException exception) {
                throw new IllegalStateException(
                        "FRONTEND_URL debe contener orígenes HTTPS exactos, sin rutas, credenciales ni comodines.", exception);
            }
        }
    }

    private void validarProxy() {
        if (!"127.0.0.1".equals(serverAddress)
                || !"none".equalsIgnoreCase(forwardHeadersStrategy)) {
            throw new IllegalStateException(
                    "El perfil prod requiere Spring en loopback y forward-headers-strategy=none; Nginx termina TLS.");
        }
    }

    private void validarStorage() {
        if (isBlank(this.storageRoot) || !Path.of(this.storageRoot).isAbsolute()) {
            throw new IllegalStateException("STORAGE_ROOT debe ser una ruta absoluta persistente en producción.");
        }
    }

    private void validarPoliticaSesion() {
        if (!"REAUTHENTICATE".equalsIgnoreCase(this.renewalMode) || this.refreshEnabled) {
            throw new IllegalStateException(
                    "La política final de sesión es REAUTHENTICATE sin refresh token. La configuración no puede contradecir ese contrato.");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
