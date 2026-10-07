package uy.edu.ctc.pamahe.modules.solicitudesventa.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import uy.edu.ctc.pamahe.modules.solicitudesventa.model.SolicitudVentaImagen;
import uy.edu.ctc.pamahe.modules.solicitudesventa.model.SolicitudVentaVehiculo;

public interface SolicitudVentaImagenRepository extends JpaRepository<SolicitudVentaImagen, Long> {
    List<SolicitudVentaImagen> findBySolicitudAndActivoTrueOrderByIdAsc(SolicitudVentaVehiculo solicitud);
    long countBySolicitudAndActivoTrue(SolicitudVentaVehiculo solicitud);
    Optional<SolicitudVentaImagen> findByIdAndSolicitudAndActivoTrue(Long id, SolicitudVentaVehiculo solicitud);
}
