package uy.edu.ctc.pamahe.modules.parametros.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.common.exception.ResourceNotFoundException;
import uy.edu.ctc.pamahe.modules.auditoria.service.AuditoriaService;
import uy.edu.ctc.pamahe.modules.parametros.dto.request.ParametroRequest;
import uy.edu.ctc.pamahe.modules.parametros.model.Parametro;
import uy.edu.ctc.pamahe.modules.parametros.repository.ParametroRepository;

@ExtendWith(MockitoExtension.class)
class ParametroServiceTest {
    @Mock ParametroRepository repository;
    @Mock AuditoriaService auditoria;
    @InjectMocks ParametroService service;

    @Test
    void crearNormalizaIdentificadorYEtiqueta() {
        when(repository.save(any())).thenAnswer(inv -> {
            Parametro p = inv.getArgument(0);
            p.setId(5L);
            return p;
        });
        var result = service.crear(request(" SUV ", " "));
        assertEquals("TIPO_VEHICULO", result.categoria());
        assertEquals("SUV", result.clave());
        assertEquals("Utilitario", result.valor());
        assertNull(result.descripcion());
        verify(auditoria).registrar("ALTA", "Parametro", 5L, "Creación de parámetro TIPO_VEHICULO/SUV");
    }

    @Test
    void duplicadoIncluyeParametrosDesactivados() {
        when(repository.existsByCategoriaAndClave("TIPO_VEHICULO", "SUV")).thenReturn(true);
        assertThrows(BusinessException.class, () -> service.crear(request("suv", null)));
        verify(repository, never()).save(any());
        verifyNoInteractions(auditoria);
    }

    @Test
    void actualizarReactivaElMismoId() {
        Parametro p = parametro();
        p.setActivo(false);
        when(repository.findById(5L)).thenReturn(Optional.of(p));
        when(repository.save(p)).thenReturn(p);
        var result = service.actualizar(5L, request(" suv ", " descripción "));
        assertEquals(5L, result.id());
        assertTrue(result.activo());
        assertEquals("descripción", result.descripcion());
        verify(repository).existsByCategoriaAndClaveAndIdNot("TIPO_VEHICULO", "SUV", 5L);
    }

    @Test
    void actualizacionRechazaColisionConOtroId() {
        Parametro p = parametro();
        when(repository.findById(5L)).thenReturn(Optional.of(p));
        when(repository.existsByCategoriaAndClaveAndIdNot("TIPO_VEHICULO", "SUV", 5L)).thenReturn(true);
        assertThrows(BusinessException.class, () -> service.actualizar(5L, request("SUV", null)));
        verify(repository, never()).save(any());
    }

    @Test
    void bajaEsLogicaParaConservarReferenciasHistoricas() {
        Parametro p = parametro();
        when(repository.findById(5L)).thenReturn(Optional.of(p));
        service.desactivar(5L);
        assertFalse(p.getActivo());
        assertEquals("SUV", p.getClave());
        verify(repository).save(p);
        verify(repository, never()).delete(any());
    }

    @Test
    void listarPorCategoriaNormalizaYDevuelveSoloOpcionesActivasDelDominio() {
        when(repository.findByCategoriaAndActivoTrueOrderByClaveAsc("TIPO_VEHICULO"))
                .thenReturn(List.of(parametro()));

        var result = service.listarPorCategoria(" tipo_vehiculo ");

        assertEquals(List.of("SUV"), result.stream().map(r -> r.clave()).toList());
    }

    @Test
    void listadoPublicoRechazaCategoriasSinConsumidorReal() {
        assertThrows(BusinessException.class, () -> service.listarPorCategoria("ESTADO_VEHICULO"));
        verify(repository, never()).findByCategoriaAndActivoTrueOrderByClaveAsc(anyString());
    }

    @Test
    void listarSoloConsultaActivosEInexistenteEs404() {
        when(repository.findByActivoTrueOrderByCategoriaAscClaveAsc()).thenReturn(List.of(parametro()));
        assertEquals("SUV", service.listar().get(0).clave());
        assertThrows(ResourceNotFoundException.class, () -> service.actualizar(99L, request("SUV", null)));
        assertThrows(ResourceNotFoundException.class, () -> service.desactivar(99L));
    }

    private ParametroRequest request(String clave, String descripcion) {
        return new ParametroRequest(" tipo_vehiculo ", clave, " Utilitario ", descripcion);
    }

    private Parametro parametro() {
        Parametro p = new Parametro();
        p.setId(5L);
        p.setCategoria("TIPO_VEHICULO");
        p.setClave("SUV");
        p.setValor("Utilitario");
        return p;
    }
}
