package uy.edu.ctc.pamahe.modules.solicitudesventa.repository;

import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import uy.edu.ctc.pamahe.modules.solicitudesventa.model.SolicitudVentaVehiculo;

public interface SolicitudVentaVehiculoRepository extends JpaRepository<SolicitudVentaVehiculo, Long> {
    @EntityGraph(attributePaths = "revisadaPor")
    List<SolicitudVentaVehiculo> findByActivoTrueOrderByCreadoEnDesc();
}
