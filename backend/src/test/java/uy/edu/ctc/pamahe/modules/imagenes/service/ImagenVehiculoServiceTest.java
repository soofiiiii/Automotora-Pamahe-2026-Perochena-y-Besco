package uy.edu.ctc.pamahe.modules.imagenes.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;
import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.common.exception.ResourceNotFoundException;
import uy.edu.ctc.pamahe.modules.auditoria.service.AuditoriaService;
import uy.edu.ctc.pamahe.modules.imagenes.dto.request.ActualizarVisibilidadImagenRequest;
import uy.edu.ctc.pamahe.modules.imagenes.model.ImagenVehiculo;
import uy.edu.ctc.pamahe.modules.imagenes.repository.ImagenVehiculoRepository;
import uy.edu.ctc.pamahe.modules.usuarios.service.UsuarioActualService;
import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.service.VehiculoService;

@ExtendWith(MockitoExtension.class)
class ImagenVehiculoServiceTest {
    @Mock ImagenVehiculoRepository repository;
    @Mock VehiculoService vehiculos;
    @Mock UsuarioActualService usuarios;
    @Mock FileStorageService storage;
    @Mock AuditoriaService auditoria;
    @InjectMocks ImagenVehiculoService service;

    @Test
    void nuevaImagenSiempreEsPrivadaYNoPrincipal() {
        ImagenVehiculo i = imagen();
        var file = new MockMultipartFile("file", new byte[] {1});
        when(vehiculos.buscarActivoPorId(1L)).thenReturn(i.getVehiculo());
        when(storage.guardarImagenPrivada(1L, file))
                .thenReturn(new FileStorageService.StoredImage("private/foto.png", "image/png"));
        when(repository.save(any())).thenAnswer(inv -> {
            ImagenVehiculo nueva = inv.getArgument(0);
            nueva.setId(4L);
            return nueva;
        });
        var result = service.subir(1L, file, " Revisar ");
        assertFalse(result.publica());
        assertFalse(result.principal());
        assertEquals("Revisar", result.descripcion());
        verify(usuarios).exigirRoles("ADMINISTRADOR", "DUENO", "VENDEDOR", "TALLER");
    }

    @Test
    void principalNoPuedeSerPrivada() {
        when(repository.findById(4L)).thenReturn(Optional.of(imagen()));
        assertThrows(BusinessException.class,
                () -> service.actualizarVisibilidad(4L, new ActualizarVisibilidadImagenRequest(false, true)));
        verifyNoInteractions(storage);
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void principalPublicaRetiraLasOtrasPrincipales() {
        ImagenVehiculo i = imagen();
        when(repository.findById(4L)).thenReturn(Optional.of(i));
        when(storage.moverVisibilidad("private/foto.png", 1L, true)).thenReturn("public/foto.png");
        when(repository.saveAndFlush(i)).thenReturn(i);
        var response = service.actualizarVisibilidad(4L, new ActualizarVisibilidadImagenRequest(true, true));
        assertTrue(response.publica());
        assertTrue(response.principal());
        verify(repository).quitarPrincipalDeOtras(i.getVehiculo(), 4L);
        assertEquals("public/foto.png", i.getRutaArchivo());
    }

    @Test
    void volverAPrivadaQuitaPrincipal() {
        ImagenVehiculo i = imagen();
        i.setPublica(true);
        i.setPrincipal(true);
        i.setRutaArchivo("public/foto.png");
        when(repository.findById(4L)).thenReturn(Optional.of(i));
        when(storage.moverVisibilidad("public/foto.png", 1L, false)).thenReturn("private/foto.png");
        when(repository.saveAndFlush(i)).thenReturn(i);
        var response = service.actualizarVisibilidad(4L, new ActualizarVisibilidadImagenRequest(false, false));
        assertFalse(response.publica());
        assertFalse(response.principal());
        verify(repository, never()).quitarPrincipalDeOtras(any(), any());
    }

    @Test
    void visibilidadSinCambiosNoMueveArchivo() {
        ImagenVehiculo i = imagen();
        when(repository.findById(4L)).thenReturn(Optional.of(i));
        when(repository.saveAndFlush(i)).thenReturn(i);
        service.actualizarVisibilidad(4L, new ActualizarVisibilidadImagenRequest(false, false));
        verifyNoInteractions(storage);
    }

    @Test
    void eliminarEsGerencialYBorraArchivoSoloTrasPersistirMetadatos() {
        ImagenVehiculo i = imagen();
        when(repository.findById(4L)).thenReturn(Optional.of(i));
        service.eliminarDefinitivamente(4L);
        var order = inOrder(usuarios, repository, storage);
        order.verify(usuarios).exigirRoles("ADMINISTRADOR", "DUENO");
        order.verify(repository).findById(4L);
        order.verify(repository).delete(i);
        order.verify(repository).flush();
        order.verify(storage).eliminarTrasCommit("private/foto.png");
    }

    @Test
    void sinPermisoDeEliminarNoTocaArchivoNiMetadatos() {
        when(usuarios.exigirRoles("ADMINISTRADOR", "DUENO"))
                .thenThrow(new AccessDeniedException("Solo gerencia"));
        assertThrows(AccessDeniedException.class, () -> service.eliminarDefinitivamente(4L));
        verifyNoInteractions(repository, storage);
    }

    @Test
    void imagenInexistenteOInactivaNoSeCarga() {
        assertThrows(ResourceNotFoundException.class, () -> service.cargarArchivoInterno(4L));
        ImagenVehiculo i = imagen();
        i.setActivo(false);
        when(repository.findById(4L)).thenReturn(Optional.of(i));
        assertThrows(ResourceNotFoundException.class, () -> service.cargarArchivoInterno(4L));
        verifyNoInteractions(storage);
    }

    @Test
    void listadoYCargaUsanSoloImagenesActivas() {
        ImagenVehiculo i = imagen();
        when(vehiculos.buscarActivoPorId(1L)).thenReturn(i.getVehiculo());
        when(repository.findByVehiculoAndActivoTrueOrderByPrincipalDescIdAsc(i.getVehiculo())).thenReturn(List.of(i));
        when(repository.findById(4L)).thenReturn(Optional.of(i));
        assertEquals(4L, service.listarPorVehiculo(1L).get(0).id());
        service.cargarArchivoInterno(4L);
        verify(storage).cargar("private/foto.png");
    }

    private ImagenVehiculo imagen() {
        Vehiculo v = new Vehiculo();
        v.setId(1L);
        ImagenVehiculo i = new ImagenVehiculo();
        i.setId(4L);
        i.setVehiculo(v);
        i.setRutaArchivo("private/foto.png");
        i.setPublica(false);
        i.setPrincipal(false);
        return i;
    }
}
