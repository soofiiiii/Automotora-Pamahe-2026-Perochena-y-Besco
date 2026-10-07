package uy.edu.ctc.pamahe.modules.auditoria.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.modules.auditoria.model.Auditoria;
import uy.edu.ctc.pamahe.modules.auditoria.repository.AuditoriaRepository;

@ExtendWith(MockitoExtension.class)
class AuditoriaServiceTest {
    @Mock AuditoriaRepository repository;
    @InjectMocks AuditoriaService service;

    @AfterEach
    void limpiarSesion() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void registraActorYValoresEnLaAuditoria() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("ana", "n/a", List.of()));
        service.registrar("CAMBIO_ESTADO", "Vehiculo", 7L, "Revisión", "COMPRADO", "DISPONIBLE");
        verify(repository).save(argThat(a -> "ana".equals(a.getUsuario())
                && "CAMBIO_ESTADO".equals(a.getAccion()) && "Vehiculo".equals(a.getEntidad())
                && Long.valueOf(7L).equals(a.getEntidadId()) && "COMPRADO".equals(a.getValoresAnteriores())
                && "DISPONIBLE".equals(a.getValoresNuevos())));
    }

    @Test
    void registroSimpleNoInventaSnapshots() {
        service.registrar("ALTA", "Cliente", 1L, "Alta");
        verify(repository).save(argThat(a -> a.getValoresAnteriores() == null && a.getValoresNuevos() == null));
    }

    @Test
    void combinaFiltrosYRangoIncluyeTodoElUltimoDia() {
        LocalDate desde = LocalDate.of(2026, 8, 1);
        LocalDate hasta = LocalDate.of(2026, 8, 31);
        Auditoria ultimo = evento(9L);
        when(repository.buscarPaginado("ana", "ALTA", "Compra", 7L, desde.atStartOfDay(),
                LocalDate.of(2026, 9, 1).atStartOfDay(), PageRequest.of(1, 2, Sort.by(Sort.Order.desc("creadoEn"), Sort.Order.desc("id")))))
                .thenReturn(new PageImpl<>(List.of(ultimo), PageRequest.of(1, 2), 3));
        var page = service.listarPaginado(" ana ", " ALTA ", " Compra ", 7L, desde, hasta, 1, 2);
        assertEquals(9L, page.content().get(0).id());
        assertEquals(3, page.totalElements());
        assertEquals(2, page.totalPages());
        assertFalse(page.first());
        assertTrue(page.last());
    }

    @Test
    void eventosVehiculoExponeSoloLosCamposNecesariosEnElOrdenDelRepositorio() {
        Auditoria estado = evento(1L);
        estado.setUsuario("ana");
        estado.setAccion("CAMBIO_ESTADO");
        estado.setEntidad("Vehiculo");
        estado.setEntidadId(7L);
        estado.setDetalle("Estado actualizado");
        estado.setValoresAnteriores("COMPRADO");
        estado.setValoresNuevos("DISPONIBLE");
        estado.setCreadoEn(LocalDateTime.of(2026, 9, 20, 10, 0));
        when(repository.buscarEventosVehiculo(7L)).thenReturn(List.of(estado));

        var result = service.eventosVehiculo(7L);

        assertEquals(1, result.size());
        assertEquals("ana", result.get(0).usuario());
        assertEquals("CAMBIO_ESTADO", result.get(0).accion());
        assertEquals("COMPRADO", result.get(0).valoresAnteriores());
        assertEquals("DISPONIBLE", result.get(0).valoresNuevos());
    }

    @Test
    void listadoAcotadoNormalizaVaciosYRespetaOrdenRecibido() {
        when(repository.buscar(null, null, null, null, null, null, PageRequest.of(0, 200)))
                .thenReturn(List.of(evento(9L), evento(8L)));
        var result = service.listar(" ", null, "", null, null, null);
        assertEquals(List.of(9L, 8L), result.stream().map(r -> r.id()).toList());
    }

    @Test
    void intervaloInversoNoConsultaRepositorio() {
        LocalDate hoy = LocalDate.now();
        assertThrows(BusinessException.class, () -> service.listar(null, null, null, null, hoy, hoy.minusDays(1)));
        assertThrows(BusinessException.class,
                () -> service.listarPaginado(null, null, null, null, hoy, hoy.minusDays(1), 0, 20));
        verifyNoInteractions(repository);
    }

    @ParameterizedTest
    @CsvSource({"-1,20", "0,0", "0,201"})
    void paginacionInvalidaNoConsultaRepositorio(int page, int size) {
        assertThrows(BusinessException.class,
                () -> service.listarPaginado(null, null, null, null, null, null, page, size));
        verifyNoInteractions(repository);
    }

    private Auditoria evento(Long id) {
        Auditoria a = new Auditoria();
        a.setId(id);
        a.setAccion("ALTA");
        a.setEntidad("Compra");
        a.setEntidadId(7L);
        return a;
    }
}
