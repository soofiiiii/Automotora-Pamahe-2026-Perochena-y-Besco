package uy.edu.ctc.pamahe.modules.auditoria.repository;

import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import uy.edu.ctc.pamahe.modules.auditoria.model.Auditoria;
import uy.edu.ctc.pamahe.modules.auditoria.service.AuditoriaService;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AuditoriaPaginationIntegrationTest {
    @Autowired AuditoriaRepository repository;
    @Autowired AuditoriaService service;
    @Autowired EntityManager entityManager;

    @Test
    void paginasConFechaEmpatadaSonEstablesYElRangoIncluyeElUltimoDia() {
        LocalDate fecha = LocalDate.of(2026, 8, 31);
        Long primero = insertar(fecha.atStartOfDay(), "audit-page-test");
        Long segundo = insertar(fecha.atTime(23, 59, 59), "audit-page-test");
        Long tercero = insertar(fecha.atTime(23, 59, 59), "audit-page-test");
        insertar(fecha.plusDays(1).atStartOfDay(), "audit-page-test");
        insertar(fecha.atTime(12, 0), "otro-usuario-test");
        var page0 = service.listarPaginado("audit-page-test", "ALTA", "Compra", 77L, fecha, fecha, 0, 2);
        var page1 = service.listarPaginado("audit-page-test", "ALTA", "Compra", 77L, fecha, fecha, 1, 2);
        assertEquals(3, page0.totalElements());
        assertEquals(2, page0.totalPages());
        assertEquals(List.of(tercero, segundo), page0.content().stream().map(a -> a.id()).toList());
        assertEquals(List.of(primero), page1.content().stream().map(a -> a.id()).toList());
        assertEquals(List.of(tercero, segundo, primero),
                service.listar("audit-page-test", "ALTA", "Compra", 77L, fecha, fecha)
                        .stream().map(a -> a.id()).toList());
    }

    private Long insertar(LocalDateTime fecha, String usuario) {
        Auditoria a = new Auditoria();
        a.setUsuario(usuario);
        a.setAccion("ALTA");
        a.setEntidad("Compra");
        a.setEntidadId(77L);
        a.setDetalle("Verificación de rango y orden");
        Long id = repository.saveAndFlush(a).getId();
        // CreationTimestamp lo asigna Hibernate; el dato de prueba fija un empate y los bordes del día.
        entityManager.createNativeQuery("update auditoria set creado_en = :fecha where id = :id")
                .setParameter("fecha", fecha).setParameter("id", id).executeUpdate();
        entityManager.clear();
        return id;
    }
}
