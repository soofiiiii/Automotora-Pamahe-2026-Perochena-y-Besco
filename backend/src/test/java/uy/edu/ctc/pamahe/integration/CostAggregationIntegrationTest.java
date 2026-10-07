package uy.edu.ctc.pamahe.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import java.math.BigDecimal;
import java.time.LocalDate;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import uy.edu.ctc.pamahe.modules.taller.model.*;
import uy.edu.ctc.pamahe.modules.taller.repository.RefaccionRepository;
import uy.edu.ctc.pamahe.modules.usuarios.model.Usuario;
import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:cost_aggregate;MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE")
@ActiveProfiles("test")
@Transactional
class CostAggregationIntegrationTest {
    @Autowired EntityManager em;
    @Autowired RefaccionRepository repository;

    @Test
    void sumaPreservaCentavosExcluyeCanceladasInactivasYOtroVehiculo() {
        Usuario u = new Usuario(); u.setUsername("aggregate"); u.setNombre("Ensayo");
        u.setEmail("aggregate@example.test"); u.setPasswordHash("fixture"); em.persist(u);
        Vehiculo v = vehiculo(); Vehiculo otro = vehiculo();
        assertEquals(0, BigDecimal.ZERO.compareTo(repository.sumarCostoActivo(v, EstadoTarea.CANCELADA)));
        tarea(v, u, EstadoTarea.FINALIZADA, true, "0.10");
        tarea(v, u, EstadoTarea.PENDIENTE, true, "0.20");
        tarea(v, u, EstadoTarea.CANCELADA, true, "99.00");
        tarea(v, u, EstadoTarea.FINALIZADA, false, "99.00");
        tarea(otro, u, EstadoTarea.FINALIZADA, true, "99.00");
        em.flush(); em.clear();
        assertEquals(0, new BigDecimal("0.92").compareTo(repository.sumarCostoActivo(v, EstadoTarea.CANCELADA)));
    }

    private Vehiculo vehiculo() {
        Vehiculo v = new Vehiculo(); v.setMarca("Test"); v.setModelo("Test"); v.setAnio(2020);
        em.persist(v); return v;
    }
    private void tarea(Vehiculo v, Usuario u, EstadoTarea estado, boolean activo, String repuestos) {
        Refaccion r = new Refaccion(); r.setVehiculo(v); r.setUsuarioQueRegistra(u);
        r.setFecha(LocalDate.now()); r.setTipoTrabajo(TipoTrabajo.values()[0]); r.setDescripcion("Ensayo");
        r.setEstadoTarea(estado); r.setActivo(activo); r.setCostoRepuestos(new BigDecimal(repuestos));
        r.setCostoManoObra(new BigDecimal("0.20")); r.setCostoServiciosExternos(new BigDecimal("0.11"));
        em.persist(r);
    }
}
