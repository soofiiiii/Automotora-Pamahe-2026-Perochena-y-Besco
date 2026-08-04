package uy.edu.ctc.pamahe.common.util;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.lowagie.text.Document;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;

import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.common.exception.ResourceNotFoundException;

/** 
 * Genera comprobantes administrativos dentro del almacenamiento privado.
 * Coordina el archivo con la transacción de negocio para evitar comprobantes huérfanos cuando 
 * una compra o venta no logra confirmarse en la base de datos.
 */
@Service
public class PdfService {

    @Value("${app.storage.root}")
    private String storageRoot;

    public String generarComprobante(String tipo, List<String> lineas) {
        String categoria = this.categoriaSegura(tipo);
        Path basePrivada = this.baseComprobantes();
        Path carpeta = basePrivada.resolve(categoria).normalize();
        this.validarDentroDeBase(carpeta, basePrivada);

        Path temporal = null;
        Path destino = null;
        try {
            Files.createDirectories(carpeta);
            String nombreArchivo = tipo.toLowerCase(Locale.ROOT) + "-" + UUID.randomUUID() + ".pdf";
            // El temporal evita publicar un PDF incompleto si la escritura se interrumpe. 
            temporal = Files.createTempFile(carpeta, ".tmp-", ".pdf");
            destino = carpeta.resolve(nombreArchivo).normalize();
            this.validarDentroDeBase(destino, basePrivada);

            Document document = new Document();
            try (OutputStream outputStream = Files.newOutputStream(temporal)) {
                PdfWriter.getInstance(document, outputStream);
                document.open();
                document.add(new Paragraph("Automotora Pamahe"));
                document.add(new Paragraph("Comprobante interno de " + tipo));
                document.add(new Paragraph("Fecha de emisión: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))));
                document.add(new Paragraph(" "));
                for (String linea : lineas) {
                    document.add(new Paragraph(linea));
                }
                document.add(new Paragraph(" "));
                document.add(new Paragraph("Este documento es de uso interno administrativo y no posee validez como comprobante fiscal."));
                document.close();
            }

            // Guarda el PDF definitivo y prepara el "plan de borrado" por si hay un error en el sistema.
            this.moverReemplazando(temporal, destino);
            this.eliminarSiRollback(destino);
            return categoria + "/" + nombreArchivo;
        } catch (IOException exception) {
            this.eliminarSilenciosamente(temporal);
            this.eliminarSilenciosamente(destino);
            throw new BusinessException("No se pudo generar el comprobante PDF.");
        }
    }

    public ComprobanteResource cargarComprobante(String rutaRelativa) {
        if (rutaRelativa == null || rutaRelativa.isBlank()) {
            throw new ResourceNotFoundException("La operación no posee un comprobante generado.");
        }

        Path base = this.baseComprobantes();
        Path archivo = base.resolve(rutaRelativa).normalize();
        this.validarDentroDeBase(archivo, base);
        if (!Files.isRegularFile(archivo)) {
            throw new ResourceNotFoundException("No se encontró el archivo del comprobante.");
        }
        Resource resource = new FileSystemResource(archivo);
        return new ComprobanteResource(resource, archivo.getFileName().toString());
    }

    private void moverReemplazando(Path origen, Path destino) throws IOException {
        try {
            Files.move(origen, destino, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
        } catch (AtomicMoveNotSupportedException exception) {
            Files.move(origen, destino, StandardCopyOption.REPLACE_EXISTING);
        }
    }

    private String categoriaSegura(String tipo) {
        String normalizado = tipo == null ? "" : tipo.trim().toUpperCase(Locale.ROOT);
        return switch (normalizado) {
            case "COMPRA" -> "compras";
            case "VENTA" -> "ventas";
            default -> throw new BusinessException("Tipo de comprobante no permitido.");
        };
    }

    private Path baseComprobantes() {
        return Path.of(this.storageRoot, "private", "comprobantes").toAbsolutePath().normalize();
    }

    // Evita recirrudis de ruta que permitan leer o escribir fuera del almacenamiento autorizado. 
    private void validarDentroDeBase(Path path, Path base) {
        if (!path.toAbsolutePath().normalize().startsWith(base.toAbsolutePath().normalize())) {
            throw new BusinessException("La ruta del comprobante no es válida.");
        }
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

    private void eliminarSilenciosamente(Path archivo) {
        if (archivo == null) {
            return;
        }
        try {
            Files.deleteIfExists(archivo);
        } catch (IOException ignored) {
            // El archivo temporal no debe ocultar el error principal.
        }
    }

    public record ComprobanteResource(Resource resource, String filename) {
    }
    
}
