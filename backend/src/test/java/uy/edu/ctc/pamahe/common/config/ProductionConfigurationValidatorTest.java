package uy.edu.ctc.pamahe.common.config;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.nio.file.Path;
import java.util.Base64;

import org.junit.jupiter.api.Test;

class ProductionConfigurationValidatorTest {

    private final String strongSecret =
            Base64.getEncoder().encodeToString(new byte[32]);

    private final String absoluteStorage =
            Path.of(System.getProperty("user.home"), "pamahe-storage-test")
                    .toAbsolutePath()
                    .normalize()
                    .toString();

    @Test
    void aceptaConfiguracionProductivaCoherente() {
        var validator = validator(
                strongSecret,
                "https://pamahe.example",
                absoluteStorage,
                "REAUTHENTICATE",
                false);

        assertDoesNotThrow(validator::validate);
    }

    @Test
    void rechazaJwtNoBase64() {
        var validator = validator(
                "esto-no-es-base64***",
                "https://pamahe.example",
                absoluteStorage,
                "REAUTHENTICATE",
                false);

        assertThrows(IllegalStateException.class, validator::validate);
    }

    @Test
    void rechazaOrigenHttp() {
        var validator = validator(
                strongSecret,
                "http://pamahe.example",
                absoluteStorage,
                "REAUTHENTICATE",
                false);

        assertThrows(IllegalStateException.class, validator::validate);
    }

    @Test
    void rechazaStorageRelativo() {
        var validator = validator(
                strongSecret,
                "https://pamahe.example",
                "uploads",
                "REAUTHENTICATE",
                false);

        assertThrows(IllegalStateException.class, validator::validate);
    }

    @Test
    void rechazaRefreshTokenHabilitado() {
        var validator = validator(
                strongSecret,
                "https://pamahe.example",
                absoluteStorage,
                "REAUTHENTICATE",
                true);

        assertThrows(IllegalStateException.class, validator::validate);
    }

    private ProductionConfigurationValidator validator(
            String secret,
            String frontend,
            String storage,
            String renewal,
            boolean refresh) {

        return new ProductionConfigurationValidator(
                "jdbc:mysql://db.example:3306/pamahe",
                "pamahe",
                "db-password",
                secret,
                frontend,
                storage,
                renewal,
                refresh);
    }
}