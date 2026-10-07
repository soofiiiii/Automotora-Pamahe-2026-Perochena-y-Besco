package uy.edu.ctc.pamahe.common.config;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.nio.file.Path;
import java.util.Base64;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.test.util.ReflectionTestUtils;

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

    @ParameterizedTest
    @ValueSource(strings = {"https://example.test/path", "https://user@example.test", "https://example.test?x=1",
            "https://example.test#fragment", "https://*.example.test", "https://example.test,", "https://[::1]"})
    void rechazaUrlsQueNoSonOrigenesProductivos(String origin) {
        assertThrows(IllegalStateException.class,
                () -> validator(strongSecret, origin, absoluteStorage, "REAUTHENTICATE", false).validate());
    }

    @Test
    void rechazaBindPublicoYProcesamientoPrevioDeForwarded() {
        var v = validator(strongSecret, "https://pamahe.example", absoluteStorage, "REAUTHENTICATE", false);
        ReflectionTestUtils.setField(v, "serverAddress", "0.0.0.0");
        assertThrows(IllegalStateException.class, v::validate);
        ReflectionTestUtils.setField(v, "serverAddress", "127.0.0.1");
        ReflectionTestUtils.setField(v, "forwardHeadersStrategy", "framework");
        assertThrows(IllegalStateException.class, v::validate);
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