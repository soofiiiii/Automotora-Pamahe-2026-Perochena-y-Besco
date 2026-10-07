package uy.edu.ctc.pamahe.modules.imagenes.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.common.exception.ResourceNotFoundException;

class FileStorageServiceTest {
    @TempDir Path directory;
    private FileStorageService service;

    @BeforeEach
    void prepararLimites() {
        service = new FileStorageService();
        ReflectionTestUtils.setField(service, "storageRoot", directory.toString());
        ReflectionTestUtils.setField(service, "maxBytes", 1024L * 1024);
        ReflectionTestUtils.setField(service, "maxWidth", 100);
        ReflectionTestUtils.setField(service, "maxHeight", 100);
        ReflectionTestUtils.setField(service, "maxPixels", 5000L);
        ReflectionTestUtils.setField(service, "maxOutputDimension", 40);
    }

    @AfterEach
    void limpiarSincronizaciones() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @ParameterizedTest
    @ValueSource(strings = {"png", "jpeg"})
    void contenidoRealDeterminaFormatoYRedimensionado(String formato) throws Exception {
        // El nombre y MIME declarados no pueden controlar la extensión o el contenido persistido.
        var file = new MockMultipartFile("file", "../../archivo.exe", "application/octet-stream",
                imagen(formato, 80, 40));
        var stored = service.guardarImagenPrivada(7L, file);
        assertTrue(stored.relativePath().startsWith("private/vehiculos/7/"));
        assertTrue(stored.relativePath().endsWith(formato.equals("png") ? ".png" : ".jpg"));
        BufferedImage output = ImageIO.read(directory.resolve(stored.relativePath()).toFile());
        assertEquals(40, output.getWidth());
        assertEquals(20, output.getHeight());
        var resource = service.cargar(stored.relativePath());
        assertEquals("image/" + formato, resource.mediaType());
        assertTrue(resource.resource().exists());
    }

    @Test
    void archivoVacioOAusenteNoSeAcepta() {
        assertThrows(BusinessException.class, () -> service.guardarImagenPrivada(1L, null));
        assertThrows(BusinessException.class, () -> service.guardarImagenPrivada(1L,
                new MockMultipartFile("file", new byte[0])));
    }

    @Test
    void excesoDeBytesSeRechazaSinLeerElContenido() throws Exception {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getSize()).thenReturn(1024L * 1024 + 1);
        assertThrows(BusinessException.class, () -> service.guardarImagenPrivada(1L, file));
        verify(file, never()).getBytes();
    }

    @Test
    void mimeYExtensionDeImagenNoHabilitanContenidoArbitrario() {
        var falso = new MockMultipartFile("file", "foto.png", "image/png", "no es una imagen".getBytes());
        assertThrows(BusinessException.class, () -> service.guardarImagenPrivada(1L, falso));
    }

    @Test
    void firmaPngSinImagenDecodificableNoSeAcepta() {
        byte[] firma = {(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a};
        assertThrows(BusinessException.class, () -> service.guardarImagenPrivada(1L,
                new MockMultipartFile("file", "foto.png", "image/png", firma)));
    }

    @Test
    void dimensionesYPixelesSeValidanAntesDeDecodificarCompleto() throws Exception {
        for (int[] size : new int[][] {{101, 1}, {1, 101}, {80, 80}}) {
            var file = new MockMultipartFile("file", "foto.png", "image/png", imagen("png", size[0], size[1]));
            assertThrows(BusinessException.class, () -> service.guardarImagenPrivada(1L, file));
        }
    }

    @Test
    void errorDeLecturaSeTraduceAErrorDeNegocio() throws Exception {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getBytes()).thenThrow(new IOException("fallo de lectura"));
        assertThrows(BusinessException.class, () -> service.guardarImagenPrivada(1L, file));
    }

    @ParameterizedTest
    @ValueSource(strings = {"../fuera.png", "private/../../../fuera.png", "", " "})
    void rutasFueraDeRaizNoPuedenCargarseMoverseNiBorrarse(String ruta) {
        assertThrows(BusinessException.class, () -> service.cargar(ruta));
        assertThrows(BusinessException.class, () -> service.moverVisibilidad(ruta, 1L, true));
        assertThrows(BusinessException.class, () -> service.eliminarTrasCommit(ruta));
    }

    @Test
    void archivoInexistenteProduce404() {
        assertThrows(ResourceNotFoundException.class, () -> service.cargar("private/ausente.png"));
        assertThrows(ResourceNotFoundException.class, () -> service.moverVisibilidad("private/ausente.png", 1L, true));
    }

    @Test
    void cambioDeVisibilidadMueveElArchivoYRollbackLoRestaura() throws Exception {
        String ruta = subir();
        TransactionSynchronizationManager.initSynchronization();
        String publica = service.moverVisibilidad(ruta, 1L, true);
        assertFalse(Files.exists(directory.resolve(ruta)));
        assertTrue(Files.exists(directory.resolve(publica)));
        completar(TransactionSynchronization.STATUS_ROLLED_BACK);
        assertTrue(Files.exists(directory.resolve(ruta)));
        assertFalse(Files.exists(directory.resolve(publica)));
    }

    @Test
    void cargaRevertidaNoDejaArchivoHuerfano() throws Exception {
        TransactionSynchronizationManager.initSynchronization();
        String ruta = subir();
        assertTrue(Files.exists(directory.resolve(ruta)));
        completar(TransactionSynchronization.STATUS_ROLLED_BACK);
        assertFalse(Files.exists(directory.resolve(ruta)));
    }

    @Test
    void cargaConfirmadaConservaArchivo() throws Exception {
        TransactionSynchronizationManager.initSynchronization();
        String ruta = subir();
        completar(TransactionSynchronization.STATUS_COMMITTED);
        assertTrue(Files.exists(directory.resolve(ruta)));
    }

    @Test
    void eliminacionFisicaEsPosteriorAlCommit() throws Exception {
        String ruta = subir();
        TransactionSynchronizationManager.initSynchronization();
        service.eliminarTrasCommit(ruta);
        assertTrue(Files.exists(directory.resolve(ruta)));
        for (var synchronization : TransactionSynchronizationManager.getSynchronizations()) {
            synchronization.afterCommit();
        }
        assertFalse(Files.exists(directory.resolve(ruta)));
    }

    @Test
    void rollbackDeEliminacionConservaArchivo() throws Exception {
        String ruta = subir();
        TransactionSynchronizationManager.initSynchronization();
        service.eliminarTrasCommit(ruta);
        completar(TransactionSynchronization.STATUS_ROLLED_BACK);
        assertTrue(Files.exists(directory.resolve(ruta)));
    }

    @Test
    void visibilidadPuedeVolverAPrivadaYEliminacionSinTransaccionFunciona() throws Exception {
        String privada = subir();
        assertEquals(privada, service.moverVisibilidad(privada, 1L, false));
        String publica = service.moverVisibilidad(privada, 1L, true);
        String regreso = service.moverVisibilidad(publica, 1L, false);
        assertEquals(privada, regreso);
        service.eliminarTrasCommit(regreso);
        assertFalse(Files.exists(directory.resolve(regreso)));
    }

    private String subir() throws Exception {
        return service.guardarImagenPrivada(1L,
                new MockMultipartFile("file", "foto.png", "image/png", imagen("png", 20, 10))).relativePath();
    }

    private void completar(int status) {
        for (var synchronization : TransactionSynchronizationManager.getSynchronizations()) {
            synchronization.afterCompletion(status);
        }
    }

    private byte[] imagen(String formato, int width, int height) throws IOException {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        assertTrue(ImageIO.write(image, formato, bytes));
        return bytes.toByteArray();
    }
}
