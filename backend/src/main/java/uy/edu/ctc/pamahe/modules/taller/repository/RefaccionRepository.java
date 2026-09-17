package uy.edu.ctc.pamahe.modules.taller.repository;

import java.util.List;
import java.util.Optional;
import java.time.LocalDate;
import java.util.Collection;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import uy.edu.ctc.pamahe.modules.taller.model.EstadoTarea;
import uy.edu.ctc.pamahe.modules.taller.model.Refaccion;
import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;

public interface RefaccionRepository extends JpaRepository<Refaccion, Long> {
    List<Refaccion> findByActivoTrueOrderByFechaDesc();

    Page<Refaccion> findByActivoTrueOrderByFechaDesc(Pageable pageable);

    List<Refaccion> findByActivoTrueAndFechaBetweenOrderByFechaDesc(LocalDate desde, LocalDate hasta);

    List<Refaccion> findByVehiculoAndActivoTrueOrderByFechaDesc(Vehiculo vehiculo);

    List<Refaccion> findByVehiculoAndActivoTrueAndEstadoTareaNotOrderByFechaDesc(Vehiculo vehiculo,
            EstadoTarea estadoTarea);

    List<Refaccion> findByEstadoTareaAndActivoTrueOrderByFechaAsc(EstadoTarea estadoTarea);

    boolean existsByVehiculo(Vehiculo vehiculo);

    boolean existsByVehiculoAndActivoTrueAndEstadoTareaIn(Vehiculo vehiculo, Collection<EstadoTarea> estados);

    Optional<Refaccion> findByIdOperacionOffline(String idOperacionOffline);

    /** Lectura sincronizada para asegurar la visibilidad de los cambios realizados por reintentos concurrentes. */
    @Lock(LockModeType.PESSIMISTIC_READ)
    @Query("select r from Refaccion r where r.id = :id")
    Optional<Refaccion> findByIdConBloqueoLectura(@Param("id") Long id);
}
