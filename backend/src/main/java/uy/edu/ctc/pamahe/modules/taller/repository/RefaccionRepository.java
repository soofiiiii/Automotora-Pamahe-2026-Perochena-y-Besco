package uy.edu.ctc.pamahe.modules.taller.repository;

import java.util.List;
import java.util.Optional;
import java.util.Collection;

import org.springframework.data.jpa.repository.JpaRepository;

import uy.edu.ctc.pamahe.modules.taller.model.EstadoTarea;
import uy.edu.ctc.pamahe.modules.taller.model.Refaccion;
import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;

public interface RefaccionRepository extends JpaRepository<Refaccion, Long> {
    List<Refaccion> findByActivoTrueOrderByFechaDesc();
    List<Refaccion> findByVehiculoAndActivoTrueOrderByFechaDesc(Vehiculo vehiculo);
    List<Refaccion> findByVehiculoAndActivoTrueAndEstadoTareaNotOrderByFechaDesc(Vehiculo vehiculo, EstadoTarea estadoTarea);
    List<Refaccion> findByEstadoTareaAndActivoTrueOrderByFechaAsc(EstadoTarea estadoTarea);
    boolean existsByVehiculo(Vehiculo vehiculo);
    boolean existsByVehiculoAndActivoTrueAndEstadoTareaIn(Vehiculo vehiculo, Collection<EstadoTarea> estados);
    // Permite reconocer un reintento antes de crear una segunda refacción con el mismo origen offline.
    Optional<Refaccion> findByIdOperacionOffline(String idOperacionOffline);
}
