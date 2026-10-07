package uy.edu.ctc.pamahe.common.config;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;
import org.slf4j.Logger;

import org.springframework.jdbc.core.JdbcTemplate;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Component;

/**
 * Prepara el almacenamiento al iniciar la aplicación y migra rutas de versiones
 * anteriores.
 * Se separa el contenido público del privado para evitar exponer imágenes o
 * comprobantes mediante el servidor de recursos estáticos.
 */
@Component
public class StorageLayoutInitializer implements ApplicationRunner {

    private static final Logger LOGGER = LoggerFactory.getLogger(StorageLayoutInitializer.class);
    private static final String VEHICULOS_SEGMENT = "vehiculos/";

    private final JdbcTemplate jdbcTemplate;

    @Value("${app.storage.root}")
    private String storageRoot;

    public StorageLayoutInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) throws IOException {
        Path root = Path.of(this.storageRoot).toAbsolutePath().normalize();
        Files.createDirectories(root.resolve("public/vehiculos"));
        Files.createDirectories(root.resolve("private/vehiculos"));
        Files.createDirectories(root.resolve("private/comprobantes/compras"));
        Files.createDirectories(root.resolve("private/comprobantes/ventas"));

        // La base de datos determina el destino porque conserva la visibilidad actual
        // de cada imagen.
        this.migrarImagenesLegadasSegunBaseDeDatos(root);
        this.migrarDirectorioSiExiste(root.resolve("comprobantes/compra"),
                root.resolve("private/comprobantes/compras"));
        this.migrarDirectorioSiExiste(root.resolve("comprobantes/venta"), root.resolve("private/comprobantes/ventas"));
    }

    private void migrarImagenesLegadasSegunBaseDeDatos(Path root) {
        List<String> rutas;
        try {
            rutas = this.jdbcTemplate.queryForList(
                    "SELECT ruta_archivo FROM imagenes_vehiculo "
                            + "WHERE ruta_archivo LIKE 'public/vehiculos/%' "
                            + "OR ruta_archivo LIKE 'private/vehiculos/%'",
                    String.class);
        } catch (DataAccessException exception) {
            LOGGER.warn("No se pudieron consultar las imágenes legadas para migrar su almacenamiento.", exception);
            return;
        }

        Path directorioLegado = root.resolve("vehiculos").normalize();
        for (String rutaRelativa : rutas) {
            if (rutaRelativa == null) {
                continue;
            }
            int indice = rutaRelativa.indexOf(VEHICULOS_SEGMENT);
            if (indice < 0) {
                continue;
            }
            String sufijo = rutaRelativa.substring(indice + VEHICULOS_SEGMENT.length());
            Path origen = directorioLegado.resolve(sufijo).normalize();
            Path destino = root.resolve(rutaRelativa).normalize();
            // La validación de pertenencia impide que una ruta almacenada escape del
            // directorio configurado.
            if (!origen.startsWith(directorioLegado) || !destino.startsWith(root)) {
                LOGGER.warn("Se omitió una ruta de imagen legado no segura: {}", rutaRelativa);
                continue;
            }
            this.moverArchivoSiExiste(origen, destino);
        }
    }

    private void moverArchivoSiExiste(Path origen, Path destino) {
        if (!Files.isRegularFile(origen)) {
            return;
        }
        try {
            Files.createDirectories(destino.getParent());
            if (!Files.exists(destino)) {
                Files.move(origen, destino, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException exception) {
            LOGGER.warn("No se pudo migrar el archivo legado {}", origen, exception);
        }
    }

    private void migrarDirectorioSiExiste(Path origen, Path destino) throws IOException {
        if (!Files.isDirectory(origen)) {
            return;
        }
        try (var archivos = Files.walk(origen)) {
            archivos.filter(Files::isRegularFile).forEach(archivo -> {
                Path relativo = origen.relativize(archivo);
                this.moverArchivoSiExiste(archivo, destino.resolve(relativo).normalize());
            });
        }
    }
}
