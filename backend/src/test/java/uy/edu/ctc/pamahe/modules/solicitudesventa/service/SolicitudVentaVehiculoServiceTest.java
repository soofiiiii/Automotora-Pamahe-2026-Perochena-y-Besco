package uy.edu.ctc.pamahe.modules.solicitudesventa.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import java.time.Year;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.modules.auditoria.service.AuditoriaService;
import uy.edu.ctc.pamahe.modules.imagenes.service.FileStorageService;
import uy.edu.ctc.pamahe.modules.solicitudesventa.dto.request.ActualizarEstadoSolicitudVentaRequest;
import uy.edu.ctc.pamahe.modules.solicitudesventa.dto.request.SolicitudVentaPublicaRequest;
import uy.edu.ctc.pamahe.modules.solicitudesventa.model.EstadoSolicitudVenta;
import uy.edu.ctc.pamahe.modules.solicitudesventa.model.SolicitudVentaImagen;
import uy.edu.ctc.pamahe.modules.solicitudesventa.model.SolicitudVentaVehiculo;
import uy.edu.ctc.pamahe.modules.solicitudesventa.repository.SolicitudVentaImagenRepository;
import uy.edu.ctc.pamahe.modules.solicitudesventa.repository.SolicitudVentaVehiculoRepository;
import uy.edu.ctc.pamahe.modules.usuarios.model.Usuario;
import uy.edu.ctc.pamahe.modules.usuarios.service.UsuarioActualService;

@ExtendWith(MockitoExtension.class)
class SolicitudVentaVehiculoServiceTest {

    @Mock
    SolicitudVentaVehiculoRepository solicitudRepository;
    @Mock
    SolicitudVentaImagenRepository imagenRepository;
    @Mock
    FileStorageService fileStorageService;
    @Mock
    UsuarioActualService usuarioActualService;
    @Mock
    AuditoriaService auditoriaService;

    private SolicitudVentaVehiculoService service() {
        return new SolicitudVentaVehiculoService(
                solicitudRepository, imagenRepository, fileStorageService,
                usuarioActualService, auditoriaService);
    }

    @Test
    void formularioPublicoPersisteSolicitudYFotografiasPrivadas() {
        SolicitudVentaPublicaRequest request = requestConFotos(2);
        when(solicitudRepository.saveAndFlush(any())).thenAnswer(invocation -> {
            SolicitudVentaVehiculo solicitud = invocation.getArgument(0);
            solicitud.setId(11L);
            return solicitud;
        });
        when(fileStorageService.guardarImagenSolicitudVenta(eq(11L), any()))
                .thenReturn(new FileStorageService.StoredImage("private/solicitudes-venta/11/foto.webp", "image/webp"));

        var response = service().crearPublica(request);

        assertEquals(11L, response.id());
        assertEquals(EstadoSolicitudVenta.PENDIENTE, response.estado());
        verify(fileStorageService, times(2)).guardarImagenSolicitudVenta(eq(11L), any());
        verify(imagenRepository, times(2)).save(any(SolicitudVentaImagen.class));
    }

    @Test
    void formularioPublicoRechazaMasDeCincoFotos() {
        assertThrows(BusinessException.class, () -> service().crearPublica(requestConFotos(6)));
        verifyNoInteractions(solicitudRepository, imagenRepository, fileStorageService);
    }

    @Test
    void formularioPublicoRechazaAnioPosteriorAlActual() {
        SolicitudVentaPublicaRequest request = requestConFotos(1);
        request.setAnio(Year.now().getValue() + 1);

        assertThrows(BusinessException.class, () -> service().crearPublica(request));
        verifyNoInteractions(solicitudRepository, imagenRepository, fileStorageService);
    }

    @Test
    void formularioPublicoRechazaTelefonoSinDigitosValidos() {
        SolicitudVentaPublicaRequest request = requestConFotos(1);
        request.setTelefono("--------");

        assertThrows(BusinessException.class, () -> service().crearPublica(request));
        verifyNoInteractions(solicitudRepository, imagenRepository, fileStorageService);
    }

    @Test
    void revisionInternaRegistraUsuarioYEstado() {
        Usuario usuario = new Usuario();
        usuario.setId(7L);
        usuario.setNombre("Vendedor");
        SolicitudVentaVehiculo solicitud = new SolicitudVentaVehiculo();
        solicitud.setId(11L);
        solicitud.setActivo(true);
        solicitud.setNombre("Ana");
        solicitud.setTelefono("099123456");
        solicitud.setMarca("Toyota");
        solicitud.setModelo("Corolla");
        solicitud.setAnio(2020);
        solicitud.setKilometraje(80000);
        solicitud.setEstado(EstadoSolicitudVenta.PENDIENTE);

        when(usuarioActualService.exigirRoles("ADMINISTRADOR", "DUENO", "VENDEDOR")).thenReturn(usuario);
        when(solicitudRepository.findById(11L)).thenReturn(Optional.of(solicitud));
        when(solicitudRepository.save(solicitud)).thenReturn(solicitud);
        when(imagenRepository.findBySolicitudAndActivoTrueOrderByIdAsc(solicitud)).thenReturn(List.of());

        var response = service().actualizarEstado(
                11L, new ActualizarEstadoSolicitudVentaRequest(EstadoSolicitudVenta.EN_REVISION));

        assertEquals(EstadoSolicitudVenta.EN_REVISION, response.estado());
        assertEquals(7L, response.revisadaPorId());
        assertNotNull(response.revisadaEn());
        verify(auditoriaService).registrar(
                eq("CAMBIO_ESTADO"), eq("SolicitudVentaVehiculo"), eq(11L), anyString(), anyString(), anyString());
    }

    private SolicitudVentaPublicaRequest requestConFotos(int cantidad) {
        SolicitudVentaPublicaRequest request = new SolicitudVentaPublicaRequest();
        request.setNombre(" Ana ");
        request.setTelefono(" 099 123 456 ");
        request.setMarca(" Toyota ");
        request.setModelo(" Corolla ");
        request.setAnio(2020);
        request.setKilometraje(80000);
        request.setObservaciones("Buen estado");
        request.setFotografias(java.util.stream.IntStream.range(0, cantidad)
                .mapToObj(i -> new MockMultipartFile(
                        "fotografias", "foto-" + i + ".jpg", "image/jpeg", new byte[] { 1, 2, 3 }))
                .map(file -> (org.springframework.web.multipart.MultipartFile) file)
                .toList());
        return request;
    }
}
