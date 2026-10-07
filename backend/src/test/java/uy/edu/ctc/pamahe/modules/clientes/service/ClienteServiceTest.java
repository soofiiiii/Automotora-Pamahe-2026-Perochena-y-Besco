package uy.edu.ctc.pamahe.modules.clientes.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.common.exception.ResourceNotFoundException;
import uy.edu.ctc.pamahe.modules.auditoria.service.AuditoriaService;
import uy.edu.ctc.pamahe.modules.clientes.dto.request.ClienteRequest;
import uy.edu.ctc.pamahe.modules.clientes.model.Cliente;
import uy.edu.ctc.pamahe.modules.clientes.model.TipoCliente;
import uy.edu.ctc.pamahe.modules.clientes.repository.ClienteRepository;

@ExtendWith(MockitoExtension.class)
class ClienteServiceTest {
    @Mock ClienteRepository repository;
    @Mock AuditoriaService auditoria;
    @InjectMocks ClienteService service;

    @Test
    void altaNormalizaDocumentoTelefonoYCorreoAntesDeGuardar() {
        when(repository.save(any())).thenAnswer(inv -> {
            Cliente c = inv.getArgument(0);
            c.setId(1L);
            return c;
        });
        var result = service.crear(request());
        assertEquals("AB1234", result.documento());
        assertEquals("ana@example.test", result.email());
        assertEquals("+59899123456", result.telefono());
        assertEquals("Ana", result.nombre());
        assertNull(result.razonSocial());
        verify(auditoria).registrar("ALTA", "Cliente", 1L, "Creación de cliente");
    }

    @Test
    void documentoDuplicadoNoSeBloqueaEnElServicio() {
        when(repository.save(any())).thenAnswer(inv -> {
            Cliente c = inv.getArgument(0);
            c.setId(2L);
            return c;
        });
        var result = service.crear(request());
        assertEquals("AB1234", result.documento());
        verify(repository).save(any(Cliente.class));
        verify(auditoria).registrar("ALTA", "Cliente", 2L, "Creación de cliente");
    }

    @Test
    void busquedaExactaPorDocumentoNormalizaYDevuelveCoincidenciaSinBloquear() {
        Cliente existente = cliente();
        when(repository.findFirstByDocumentoAndActivoTrueOrderByIdAsc("AB1234"))
                .thenReturn(Optional.of(existente));

        var result = service.buscarActivoPorDocumento(" ab-12.34 ");

        assertNotNull(result);
        assertEquals(1L, result.id());
        assertEquals("AB1234", result.documento());
        verify(repository).findFirstByDocumentoAndActivoTrueOrderByIdAsc("AB1234");
    }

    @Test
    void busquedaExactaPorDocumentoInexistenteDevuelveNull() {
        when(repository.findFirstByDocumentoAndActivoTrueOrderByIdAsc("99999999"))
                .thenReturn(Optional.empty());
        assertNull(service.buscarActivoPorDocumento("9.999.999-9"));
    }

    @Test
    void actualizarNoBloqueaElDocumentoYConservaAuditoria() {
        Cliente c = cliente();
        when(repository.findById(1L)).thenReturn(Optional.of(c));
        when(repository.save(c)).thenReturn(c);
        var result = service.actualizar(1L, request());
        assertEquals("AB1234", result.documento());
        verify(auditoria).registrar("MODIFICACION", "Cliente", 1L, "Actualización de cliente");
    }

    @Test
    void bajaLogicaConservaIdentidadYBloqueaNuevasOperaciones() {
        Cliente c = cliente();
        when(repository.findById(1L)).thenReturn(Optional.of(c));
        service.desactivar(1L);
        assertFalse(c.getActivo());
        assertEquals(1L, service.obtener(1L).id());
        assertThrows(ResourceNotFoundException.class, () -> service.buscarActivoPorId(1L));
        verify(repository, never()).delete(any());
        verify(auditoria).registrar("BAJA_LOGICA", "Cliente", 1L, "Desactivación de cliente");
    }

    @Test
    void consultaDeInexistenteEs404YActivoSeDevuelve() {
        assertThrows(ResourceNotFoundException.class, () -> service.buscarPorId(1L));
        Cliente c = cliente();
        when(repository.findById(1L)).thenReturn(Optional.of(c));
        assertSame(c, service.buscarActivoPorId(1L));
    }

    @Test
    void listadosConservanPaginacionReal() {
        Cliente c = cliente();
        when(repository.findByActivoTrueOrderByNombreAsc()).thenReturn(List.of(c));
        when(repository.findByActivoTrueOrderByNombreAsc(PageRequest.of(1, 2)))
                .thenReturn(new PageImpl<>(List.of(c), PageRequest.of(1, 2), 3));
        assertEquals(1L, service.listar().get(0).id());
        var page = service.listarPaginado(1, 2);
        assertEquals(3, page.totalElements());
        assertEquals(2, page.totalPages());
        assertEquals(1L, page.content().get(0).id());
    }

    @ParameterizedTest
    @CsvSource({"-1,10", "0,0", "0,101"})
    void paginacionInvalidaNoConsultaRepositorio(int page, int size) {
        assertThrows(BusinessException.class, () -> service.listarPaginado(page, size));
        verifyNoInteractions(repository);
    }

    private ClienteRequest request() {
        return new ClienteRequest(" Ana ", " Pérez ", " ", " ab-12.34 ", " +598 (99) 123-456 ",
                " ANA@EXAMPLE.TEST ", null, TipoCliente.AMBOS);
    }

    private Cliente cliente() {
        Cliente c = new Cliente();
        c.setId(1L);
        c.setNombre("Ana");
        c.setDocumento("AB1234");
        c.setTipoCliente(TipoCliente.AMBOS);
        return c;
    }
}
