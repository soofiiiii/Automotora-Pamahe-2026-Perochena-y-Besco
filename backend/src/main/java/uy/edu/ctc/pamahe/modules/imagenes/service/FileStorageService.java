package uy.edu.ctc.pamahe.modules.imagenes.service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Iterator;
import java.util.Locale;
import java.util.UUID;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;

import java.awt.image.BufferedImage;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.common.exception.ResourceNotFoundException;

/**
 * Gestiona archivos de imágenes fuera de la base de datos con validación defensiva.
 * Cada carga se decodifica y se vuelve a codificar para no confiar en nombre, extensión o MIME
 * provistos por el cliente, y se coordina con la transacción que registra sus metadatos.
 */
@Service
public class FileStorageService {

    @Value("${app.storage.root}")
    private String storageRoot;

    @Value("${app.storage.images.max-bytes:12582912}")
    private long maxBytes;

    @Value("${app.storage.images.max-width:8000}")
    private int maxWidth;

    @Value("${app.storage.images.max-height:8000}")
    private int maxHeight;

    @Value("${app.storage.images.max-output-dimension:1920}")
    private int maxOutputDimension;

    @Value("${app.storage.images.max-pixels:24000000}")
    private long maxPixels;

    public StoredImage guardarImagenPrivada(Long vehiculoId, MultipartFile file) {
        return guardarImagenEnDirectorio("private/vehiculos/" + vehiculoId, file,
                "No se pudo guardar la imagen del vehículo.");
    }

    public StoredImage guardarImagenSolicitudVenta(Long solicitudId, MultipartFile file) {
        return guardarImagenEnDirectorio("private/solicitudes-venta/" + solicitudId, file,
                "No se pudo guardar una de las fotografías de la solicitud.");
    }

    private StoredImage guardarImagenEnDirectorio(String directorioRelativo, MultipartFile file, String mensajeError) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Seleccioná una imagen.");
        }
        if (file.getSize() > this.maxBytes) {
            throw new BusinessException("La imagen supera el tamaño máximo permitido.");
        }

        try {
            byte[] contenido = file.getBytes();
            DetectedFormat formato = this.detectarFormato(contenido);
            BufferedImage original = this.leerImagenValidada(contenido);

            OutputFormat salida = formato == DetectedFormat.JPEG ? OutputFormat.JPEG : OutputFormat.PNG;
            BufferedImage procesada = this.redimensionar(original, salida);
            String nombreArchivo = UUID.randomUUID() + salida.extension;
            String rutaRelativa = directorioRelativo + "/" + nombreArchivo;
            Path destino = this.resolverRutaSegura(rutaRelativa);
            Files.createDirectories(destino.getParent());

            Path temporal = Files.createTempFile(destino.getParent(), ".upload-", ".tmp");
            try {
                boolean escrita = ImageIO.write(procesada, salida.imageIoFormat, temporal.toFile());
                if (!escrita) {
                    throw new BusinessException("No pudimos procesar la imagen seleccionada. Probá con otro archivo JPG, PNG o WebP.");
                }
                this.moverReemplazando(temporal, destino);
            } finally {
                Files.deleteIfExists(temporal);
            }

            this.eliminarSiRollback(destino);
            return new StoredImage(rutaRelativa, salida.mediaType);
        } catch (BusinessException exception) {
            throw exception;
        } catch (IOException exception) {
            throw new BusinessException(mensajeError);
        }
    }

    public String moverVisibilidad(String rutaActual, Long vehiculoId, boolean publica) {
        Path origen = this.resolverRutaSegura(rutaActual);
        if (!Files.isRegularFile(origen)) {
            throw new ResourceNotFoundException("No se encontró el archivo de la imagen.");
        }
        String nombre = origen.getFileName().toString();
        String nuevaRuta = (publica ? "public" : "private") + "/vehiculos/" + vehiculoId + "/" + nombre;
        Path destino = this.resolverRutaSegura(nuevaRuta);
        if (origen.equals(destino)) {
            return rutaActual;
        }
        try {
            Files.createDirectories(destino.getParent());
            this.moverReemplazando(origen, destino);
            this.revertirMovimientoSiRollback(origen, destino);
            return nuevaRuta;
        } catch (IOException exception) {
            throw new BusinessException("No pudimos actualizar la visibilidad de la imagen.");
        }
    }

    public StoredResource cargar(String rutaRelativa) {
        Path archivo = this.resolverRutaSegura(rutaRelativa);
        if (!Files.isRegularFile(archivo)) {
            throw new ResourceNotFoundException("No se encontró el archivo de la imagen.");
        }
        return new StoredResource(
                new FileSystemResource(archivo),
                archivo.getFileName().toString(),
                this.mediaTypePorExtension(archivo.getFileName().toString())
        );
    }

    public void eliminarTrasCommit(String rutaRelativa) {
        Path archivo = this.resolverRutaSegura(rutaRelativa);
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            this.eliminarSilenciosamente(archivo);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                eliminarSilenciosamente(archivo);
            }
        });
    }

    private BufferedImage leerImagenValidada(byte[] contenido) throws IOException {
        try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(contenido))) {
            if (input == null) {
                throw new BusinessException("El archivo no contiene una imagen válida.");
            }
            Iterator<ImageReader> lectores = ImageIO.getImageReaders(input);
            if (!lectores.hasNext()) {
                throw new BusinessException("El archivo no contiene una imagen válida. Usá JPG, PNG o WebP.");
            }

            ImageReader lector = lectores.next();
            try {
                lector.setInput(input, true, true);
                int ancho = lector.getWidth(0);
                int alto = lector.getHeight(0);
                // El límite de píxeles reduce el riesgo de archivos pequeños
                // que se expanden excesivamente al decodificar.
                long pixeles = (long) ancho * alto;
                if (ancho <= 0 || alto <= 0
                        || ancho > this.maxWidth || alto > this.maxHeight
                        || pixeles > this.maxPixels) {
                    throw new BusinessException("La imagen tiene dimensiones demasiado grandes. Probá con una imagen de menor resolución.");
                }
                BufferedImage imagen = lector.read(0);
                if (imagen == null) {
                    throw new BusinessException("El archivo no contiene una imagen válida.");
                }
                return imagen;
            } finally {
                lector.dispose();
            }
        }
    }

    private void moverReemplazando(Path origen, Path destino) throws IOException {
        try {
            Files.move(origen, destino, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
        } catch (AtomicMoveNotSupportedException exception) {
            Files.move(origen, destino, StandardCopyOption.REPLACE_EXISTING);
        }
    }

    private DetectedFormat detectarFormato(byte[] contenido) {
        if (contenido.length >= 8
                && (contenido[0] & 0xFF) == 0x89
                && contenido[1] == 0x50 && contenido[2] == 0x4E && contenido[3] == 0x47
                && contenido[4] == 0x0D && contenido[5] == 0x0A && contenido[6] == 0x1A && contenido[7] == 0x0A) {
            return DetectedFormat.PNG;
        }
        if (contenido.length >= 3
                && (contenido[0] & 0xFF) == 0xFF
                && (contenido[1] & 0xFF) == 0xD8
                && (contenido[2] & 0xFF) == 0xFF) {
            return DetectedFormat.JPEG;
        }
        if (contenido.length >= 12
                && contenido[0] == 'R' && contenido[1] == 'I' && contenido[2] == 'F' && contenido[3] == 'F'
                && contenido[8] == 'W' && contenido[9] == 'E' && contenido[10] == 'B' && contenido[11] == 'P') {
            return DetectedFormat.WEBP;
        }
        throw new BusinessException("Solo se permiten imágenes JPEG, PNG o WebP válidas.");
    }

    private BufferedImage redimensionar(BufferedImage original, OutputFormat salida) {
        int ancho = original.getWidth();
        int alto = original.getHeight();
        double escala = Math.min(1.0, (double) this.maxOutputDimension / Math.max(ancho, alto));
        int nuevoAncho = Math.max(1, (int) Math.round(ancho * escala));
        int nuevoAlto = Math.max(1, (int) Math.round(alto * escala));
        int tipo = salida == OutputFormat.JPEG ? BufferedImage.TYPE_INT_RGB : BufferedImage.TYPE_INT_ARGB;
        BufferedImage destino = new BufferedImage(nuevoAncho, nuevoAlto, tipo);
        Graphics2D graphics = destino.createGraphics();
        try {
            if (salida == OutputFormat.JPEG) {
                graphics.setColor(Color.WHITE);
                graphics.fillRect(0, 0, nuevoAncho, nuevoAlto);
            }
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            graphics.drawImage(original, 0, 0, nuevoAncho, nuevoAlto, null);
        } finally {
            graphics.dispose();
        }
        return destino;
    }

    // Restringe todas las operaciones al directorio raíz y bloquea intentos de path traversal.
    private Path resolverRutaSegura(String rutaRelativa) {
        if (rutaRelativa == null || rutaRelativa.isBlank()) {
            throw new BusinessException("No pudimos acceder al archivo de la imagen.");
        }
        Path base = Path.of(this.storageRoot).toAbsolutePath().normalize();
        Path archivo = base.resolve(rutaRelativa).normalize();
        if (!archivo.startsWith(base)) {
            throw new BusinessException("No pudimos acceder al archivo de la imagen.");
        }
        return archivo;
    }

    private String mediaTypePorExtension(String nombre) {
        String lower = nombre.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
            return "image/jpeg";
        }
        if (lower.endsWith(".png")) {
            return "image/png";
        }
        if (lower.endsWith(".webp")) {
            return "image/webp";
        }
        return "application/octet-stream";
    }

    private void eliminarSiRollback(Path archivo) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status == STATUS_ROLLED_BACK) {
                    eliminarSilenciosamente(archivo);
                }
            }
        });
    }

    private void revertirMovimientoSiRollback(Path origen, Path destino) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status == STATUS_ROLLED_BACK && Files.exists(destino)) {
                    try {
                        Files.createDirectories(origen.getParent());
                        Files.move(destino, origen, StandardCopyOption.REPLACE_EXISTING);
                    } catch (IOException ignored) {
                        // El fallo se deja registrado por la operación principal.
                    }
                }
            }
        });
    }

    private void eliminarSilenciosamente(Path archivo) {
        try {
            Files.deleteIfExists(archivo);
        } catch (IOException ignored) {
            // La eliminación física no debe reemplazar el resultado de la transacción.
        }
    }

    private enum DetectedFormat { JPEG, PNG, WEBP }

    private enum OutputFormat {
        JPEG(".jpg", "jpeg", "image/jpeg"),
        PNG(".png", "png", "image/png");

        private final String extension;
        private final String imageIoFormat;
        private final String mediaType;

        OutputFormat(String extension, String imageIoFormat, String mediaType) {
            this.extension = extension;
            this.imageIoFormat = imageIoFormat;
            this.mediaType = mediaType;
        }
    }

    public record StoredImage(String relativePath, String mediaType) {
    }

    public record StoredResource(Resource resource, String filename, String mediaType) {
    }
}
